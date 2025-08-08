/**
 * Vector Store for Face Embeddings
 * Manages storage, retrieval, and similarity calculations for user face embeddings
 */

export interface UserEmbedding {
  userId: string
  embedding: number[]
  metadata: {
    timestamp: string
    quality: number
    frontality: number
    symmetry: number
    resolution: number
  }
  score?: number // Percentile score (calculated dynamically)
  vibeTags?: string[]
}

export interface SimilarityResult {
  userId: string
  similarity: number
  metadata: UserEmbedding['metadata']
}

export interface ScoreDistribution {
  mean: number
  std: number
  percentiles: {
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
    p95: number
    p99: number
  }
}

/**
 * In-memory vector store with FAISS-like functionality
 * In production, this would be replaced with Qdrant, Milvus, or Pinecone
 */
export class FaceVectorStore {
  private embeddings: Map<string, UserEmbedding> = new Map()
  private readonly EMBEDDING_DIM = 512
  private readonly MAX_USERS = 10000 // Limit for demo
  
  /**
   * Add a new user embedding to the store
   */
  async addEmbedding(userEmbedding: UserEmbedding): Promise<boolean> {
    try {
      // Validate embedding
      if (!this.validateEmbedding(userEmbedding.embedding)) {
        throw new Error('Invalid embedding dimensions')
      }
      
      // Check if user already exists (one-time scoring rule)
      if (this.embeddings.has(userEmbedding.userId)) {
        throw new Error('User already has a score (one-time scoring only)')
      }
      
      // Check capacity
      if (this.embeddings.size >= this.MAX_USERS) {
        throw new Error('Vector store at capacity')
      }
      
      // Normalize embedding
      const normalizedEmbedding = this.normalizeVector(userEmbedding.embedding)
      
      // Store the embedding
      this.embeddings.set(userEmbedding.userId, {
        ...userEmbedding,
        embedding: normalizedEmbedding
      })
      
      // Recalculate all scores after adding new user
      await this.recalculateAllScores()
      
      return true
    } catch (error) {
      console.error('Failed to add embedding:', error)
      return false
    }
  }
  
  /**
   * Get user embedding by ID
   */
  async getUserEmbedding(userId: string): Promise<UserEmbedding | null> {
    return this.embeddings.get(userId) || null
  }
  
  /**
   * Check if user already has an embedding
   */
  async hasUser(userId: string): Promise<boolean> {
    return this.embeddings.has(userId)
  }
  
  /**
   * Find most similar users to a given embedding
   */
  async findSimilar(
    targetEmbedding: number[], 
    limit: number = 10,
    excludeUserId?: string
  ): Promise<SimilarityResult[]> {
    const normalizedTarget = this.normalizeVector(targetEmbedding)
    const similarities: SimilarityResult[] = []
    
    for (const [userId, userEmbedding] of this.embeddings.entries()) {
      if (excludeUserId && userId === excludeUserId) {
        continue
      }
      
      const similarity = this.cosineSimilarity(normalizedTarget, userEmbedding.embedding)
      
      similarities.push({
        userId,
        similarity,
        metadata: userEmbedding.metadata
      })
    }
    
    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity)
    
    return similarities.slice(0, limit)
  }
  
  /**
   * Calculate percentile score for a user based on similarity to all others
   */
  async calculatePercentileScore(userId: string): Promise<number | null> {
    const userEmbedding = this.embeddings.get(userId)
    if (!userEmbedding) {
      return null
    }
    
    // Calculate average similarity to all other users
    const similarities: number[] = []
    
    for (const [otherUserId, otherEmbedding] of this.embeddings.entries()) {
      if (otherUserId === userId) continue
      
      const similarity = this.cosineSimilarity(
        userEmbedding.embedding, 
        otherEmbedding.embedding
      )
      similarities.push(similarity)
    }
    
    if (similarities.length === 0) {
      return 100 // First user gets 100%
    }
    
    // Calculate user's average similarity to others
    const userAvgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length
    
    // Get all users' average similarities for percentile calculation
    const allAvgSimilarities = await this.getAllAverageSimilarities()
    
    // Calculate percentile rank
    const percentile = this.calculatePercentileRank(userAvgSimilarity, allAvgSimilarities)
    
    return Math.round(percentile * 1000) / 10 // Round to 1 decimal place
  }
  
  /**
   * Get all users sorted by score (highest first)
   */
  async getLeaderboard(limit: number = 100): Promise<UserEmbedding[]> {
    const users = Array.from(this.embeddings.values())
    
    // Ensure all users have scores
    for (const user of users) {
      if (user.score === undefined) {
        user.score = await this.calculatePercentileScore(user.userId) || 0
      }
    }
    
    // Sort by score (highest first)
    users.sort((a, b) => (b.score || 0) - (a.score || 0))
    
    // Resolve ties with timestamp (earlier = higher rank)
    users.sort((a, b) => {
      if (Math.abs((a.score || 0) - (b.score || 0)) < 0.1) {
        return new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime()
      }
      return (b.score || 0) - (a.score || 0)
    })
    
    // Ensure no exact ties (add small differentiator)
    for (let i = 1; i < users.length; i++) {
      if (users[i].score === users[i-1].score) {
        users[i].score = (users[i].score || 0) - 0.1 * i
      }
    }
    
    return users.slice(0, limit)
  }
  
  /**
   * Get score distribution statistics
   */
  async getScoreDistribution(): Promise<ScoreDistribution> {
    const scores = Array.from(this.embeddings.values())
      .map(user => user.score || 0)
      .filter(score => score > 0)
    
    if (scores.length === 0) {
      return {
        mean: 0,
        std: 0,
        percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 }
      }
    }
    
    scores.sort((a, b) => a - b)
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const std = Math.sqrt(variance)
    
    const percentiles = {
      p10: this.getPercentile(scores, 0.1),
      p25: this.getPercentile(scores, 0.25),
      p50: this.getPercentile(scores, 0.5),
      p75: this.getPercentile(scores, 0.75),
      p90: this.getPercentile(scores, 0.9),
      p95: this.getPercentile(scores, 0.95),
      p99: this.getPercentile(scores, 0.99)
    }
    
    return { mean, std, percentiles }
  }
  
  /**
   * Get total number of users in the store
   */
  async getUserCount(): Promise<number> {
    return this.embeddings.size
  }
  
  /**
   * Recalculate all user scores (called when new user is added)
   */
  private async recalculateAllScores(): Promise<void> {
    for (const [userId, userEmbedding] of this.embeddings.entries()) {
      const newScore = await this.calculatePercentileScore(userId)
      if (newScore !== null) {
        userEmbedding.score = newScore
      }
    }
  }
  
  /**
   * Get average similarities for all users
   */
  private async getAllAverageSimilarities(): Promise<number[]> {
    const avgSimilarities: number[] = []
    
    for (const [userId, userEmbedding] of this.embeddings.entries()) {
      const similarities: number[] = []
      
      for (const [otherUserId, otherEmbedding] of this.embeddings.entries()) {
        if (userId === otherUserId) continue
        
        const similarity = this.cosineSimilarity(
          userEmbedding.embedding,
          otherEmbedding.embedding
        )
        similarities.push(similarity)
      }
      
      if (similarities.length > 0) {
        const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length
        avgSimilarities.push(avgSimilarity)
      }
    }
    
    return avgSimilarities
  }
  
  /**
   * Calculate percentile rank of a value in an array
   */
  private calculatePercentileRank(value: number, array: number[]): number {
    if (array.length === 0) return 1.0
    
    const sorted = [...array].sort((a, b) => a - b)
    let rank = 0
    
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] < value) {
        rank++
      } else if (sorted[i] === value) {
        rank += 0.5 // Handle ties
      }
    }
    
    return rank / sorted.length
  }
  
  /**
   * Get percentile value from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1
    return sortedArray[Math.max(0, index)]
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match')
    }
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }
    
    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)
    
    if (normA === 0 || normB === 0) {
      return 0
    }
    
    return dotProduct / (normA * normB)
  }
  
  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    if (norm === 0) return vector
    return vector.map(val => val / norm)
  }
  
  /**
   * Validate embedding dimensions
   */
  private validateEmbedding(embedding: number[]): boolean {
    return (
      Array.isArray(embedding) &&
      embedding.length === this.EMBEDDING_DIM &&
      embedding.every(val => typeof val === 'number' && !isNaN(val))
    )
  }
  
  /**
   * Export all data (for persistence/backup)
   */
  async exportData(): Promise<UserEmbedding[]> {
    return Array.from(this.embeddings.values())
  }
  
  /**
   * Import data (for initialization/restore)
   */
  async importData(data: UserEmbedding[]): Promise<void> {
    this.embeddings.clear()
    
    for (const userEmbedding of data) {
      if (this.validateEmbedding(userEmbedding.embedding)) {
        this.embeddings.set(userEmbedding.userId, userEmbedding)
      }
    }
    
    await this.recalculateAllScores()
  }
}

// Use persistent vector store in production, in-memory for development
import { PersistentVectorStore } from './persistent-vector-store';

const isProduction = process.env.NODE_ENV === 'production';

// Initialize the appropriate vector store based on environment
export const faceVectorStore = isProduction 
  ? PersistentVectorStore 
  : new FaceVectorStore();