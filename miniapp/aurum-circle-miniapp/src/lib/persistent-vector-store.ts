/**
 * Persistent Vector Store using Qdrant
 * Replaces the in-memory vector store with a persistent solution
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { UserEmbedding, ScoreDistribution } from './vector-store';

// Qdrant client initialization
const qdrantClient = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: process.env.QDRANT_PORT ? parseInt(process.env.QDRANT_PORT) : 6336,
});

// Collection name for face embeddings
const COLLECTION_NAME = 'face_embeddings';

export class PersistentVectorStore {
  /**
   * Initialize the Qdrant collection
   */
  static async initializeCollection(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await qdrantClient.getCollections();
      const collectionExists = collections.collections.some(
        (collection) => collection.name === COLLECTION_NAME
      );

      if (!collectionExists) {
        // Create collection with vector configuration
        await qdrantClient.createCollection(COLLECTION_NAME, {
          vectors: {
            size: 512, // ArcFace embedding size
            distance: 'Cosine',
          },
        });
        
        console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
      } else {
        console.log(`Qdrant collection ${COLLECTION_NAME} already exists`);
      }
    } catch (error) {
      console.error('Error initializing Qdrant collection:', error);
      throw error;
    }
  }

  /**
   * Add a new user embedding to the store
   */
  static async addEmbedding(userEmbedding: UserEmbedding): Promise<boolean> {
    try {
      // Validate embedding
      if (!this.validateEmbedding(userEmbedding.embedding)) {
        throw new Error('Invalid embedding dimensions');
      }

      // Prepare payload
      const payload = {
        userId: userEmbedding.userId,
        metadata: userEmbedding.metadata,
        score: userEmbedding.score,
        vibeTags: userEmbedding.vibeTags,
      };

      // Add point to Qdrant
      await qdrantClient.upsert(COLLECTION_NAME, {
        points: [
          {
            id: userEmbedding.userId,
            vector: userEmbedding.embedding,
            payload,
          },
        ],
      });

      // Recalculate all scores after adding new user
      await this.recalculateAllScores();

      return true;
    } catch (error) {
      console.error('Failed to add embedding:', error);
      return false;
    }
  }

  /**
   * Get user embedding by ID
   */
  static async getUserEmbedding(userId: string): Promise<UserEmbedding | null> {
    try {
      const response = await qdrantClient.retrieve(COLLECTION_NAME, {
        ids: [userId],
      });

      if (response.length === 0) {
        return null;
      }

      const point = response[0];
      return {
        userId: point.payload?.userId as string,
        embedding: point.vector as number[],
        metadata: point.payload?.metadata as UserEmbedding['metadata'],
        score: point.payload?.score as number | undefined,
        vibeTags: point.payload?.vibeTags as string[] | undefined,
      };
    } catch (error) {
      console.error('Error retrieving user embedding:', error);
      return null;
    }
  }

  /**
   * Check if user already has an embedding
   */
  static async hasUser(userId: string): Promise<boolean> {
    try {
      const response = await qdrantClient.retrieve(COLLECTION_NAME, {
        ids: [userId],
      });
      return response.length > 0;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Find most similar users to a given embedding
   */
  static async findSimilar(
    targetEmbedding: number[],
    limit: number = 10,
    excludeUserId?: string
  ): Promise<Array<{ userId: string; similarity: number; metadata: UserEmbedding['metadata'] }>> {
    try {
      const normalizedTarget = this.normalizeVector(targetEmbedding);
      
      // Search in Qdrant
      const response = await qdrantClient.search(COLLECTION_NAME, {
        vector: normalizedTarget,
        limit: limit + (excludeUserId ? 1 : 0), // Get one extra if we need to exclude
        with_payload: true,
      });

      const similarities = response
        .filter(point => !excludeUserId || point.payload?.userId !== excludeUserId)
        .slice(0, limit)
        .map(point => ({
          userId: point.payload?.userId as string,
          similarity: point.score,
          metadata: point.payload?.metadata as UserEmbedding['metadata'],
        }));

      return similarities;
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get all users sorted by score (highest first)
   */
  static async getLeaderboard(limit: number = 100): Promise<UserEmbedding[]> {
    try {
      // First ensure all users have scores
      await this.recalculateAllScores();

      // Retrieve all points and sort by score
      const response = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 10000, // Adjust based on expected user count
        with_payload: true,
        with_vector: true,
      });

      const users = response.points.map(point => ({
        userId: point.payload?.userId as string,
        embedding: point.vector as number[],
        metadata: point.payload?.metadata as UserEmbedding['metadata'],
        score: point.payload?.score as number | undefined,
        vibeTags: point.payload?.vibeTags as string[] | undefined,
      }));

      // Sort by score (highest first)
      users.sort((a, b) => (b.score || 0) - (a.score || 0));

      // Resolve ties with timestamp (earlier = higher rank)
      users.sort((a, b) => {
        if (Math.abs((a.score || 0) - (b.score || 0)) < 0.1) {
          return new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime();
        }
        return (b.score || 0) - (a.score || 0);
      });

      // Ensure no exact ties (add small differentiator)
      for (let i = 1; i < users.length; i++) {
        if (users[i].score === users[i - 1].score) {
          users[i].score = (users[i].score || 0) - 0.1 * i;
        }
      }

      return users.slice(0, limit);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Get score distribution statistics
   */
  static async getScoreDistribution(): Promise<ScoreDistribution> {
    try {
      // Retrieve all points
      const response = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 10000, // Adjust based on expected user count
        with_payload: true,
      });

      const scores = response.points
        .map(point => point.payload?.score as number | undefined)
        .filter((score): score is number => score !== undefined && score > 0);

      if (scores.length === 0) {
        return {
          mean: 0,
          std: 0,
          percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
        };
      }

      scores.sort((a, b) => a - b);

      const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      const std = Math.sqrt(variance);

      const percentiles = {
        p10: this.getPercentile(scores, 0.1),
        p25: this.getPercentile(scores, 0.25),
        p50: this.getPercentile(scores, 0.5),
        p75: this.getPercentile(scores, 0.75),
        p90: this.getPercentile(scores, 0.9),
        p95: this.getPercentile(scores, 0.95),
        p99: this.getPercentile(scores, 0.99),
      };

      return { mean, std, percentiles };
    } catch (error) {
      console.error('Error getting score distribution:', error);
      return {
        mean: 0,
        std: 0,
        percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
      };
    }
  }

  /**
   * Get total number of users in the store
   */
  static async getUserCount(): Promise<number> {
    try {
      const response = await qdrantClient.getCount(COLLECTION_NAME);
      return response.count;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  /**
   * Recalculate all user scores (called when new user is added)
   */
  private static async recalculateAllScores(): Promise<void> {
    try {
      // Retrieve all points
      const response = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 10000, // Adjust based on expected user count
        with_payload: true,
        with_vector: true,
      });

      // Calculate scores for each user
      for (const point of response.points) {
        const userId = point.payload?.userId as string;
        const newScore = await this.calculatePercentileScore(userId);
        
        if (newScore !== null) {
          // Update the point with the new score
          await qdrantClient.upsert(COLLECTION_NAME, {
            points: [
              {
                id: userId,
                payload: {
                  ...point.payload,
                  score: newScore,
                },
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error('Error recalculating scores:', error);
    }
  }

  /**
   * Calculate percentile score for a user based on similarity to all others
   */
  private static async calculatePercentileScore(userId: string): Promise<number | null> {
    try {
      const userPoint = await qdrantClient.retrieve(COLLECTION_NAME, {
        ids: [userId],
        with_vector: true,
      });

      if (userPoint.length === 0) {
        return null;
      }

      const userEmbedding = userPoint[0].vector as number[];

      // Calculate average similarity to all other users
      const response = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 10000, // Adjust based on expected user count
        with_vector: true,
      });

      const similarities: number[] = [];
      for (const point of response.points) {
        if (point.id === userId) continue;

        const similarity = this.cosineSimilarity(
          userEmbedding,
          point.vector as number[]
        );
        similarities.push(similarity);
      }

      if (similarities.length === 0) {
        return 100; // First user gets 100%
      }

      // Calculate user's average similarity to others
      const userAvgSimilarity =
        similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;

      // Get all users' average similarities for percentile calculation
      const allAvgSimilarities = await this.getAllAverageSimilarities();

      // Calculate percentile rank
      const percentile = this.calculatePercentileRank(userAvgSimilarity, allAvgSimilarities);

      return Math.round(percentile * 1000) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating percentile score:', error);
      return null;
    }
  }

  /**
   * Get average similarities for all users
   */
  private static async getAllAverageSimilarities(): Promise<number[]> {
    try {
      const response = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 10000, // Adjust based on expected user count
        with_vector: true,
      });

      const avgSimilarities: number[] = [];

      for (const userPoint of response.points) {
        const userId = userPoint.id as string;
        const userEmbedding = userPoint.vector as number[];

        const similarities: number[] = [];
        for (const otherPoint of response.points) {
          if (otherPoint.id === userId) continue;

          const similarity = this.cosineSimilarity(
            userEmbedding,
            otherPoint.vector as number[]
          );
          similarities.push(similarity);
        }

        if (similarities.length > 0) {
          const avgSimilarity =
            similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
          avgSimilarities.push(avgSimilarity);
        }
      }

      return avgSimilarities;
    } catch (error) {
      console.error('Error getting average similarities:', error);
      return [];
    }
  }

  /**
   * Calculate percentile rank of a value in an array
   */
  private static calculatePercentileRank(value: number, array: number[]): number {
    if (array.length === 0) return 1.0;

    const sorted = [...array].sort((a, b) => a - b);
    let rank = 0;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] < value) {
        rank++;
      } else if (sorted[i] === value) {
        rank += 0.5; // Handle ties
      }
    }

    return rank / sorted.length;
  }

  /**
   * Get percentile value from sorted array
   */
  private static getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Normalize vector to unit length
   */
  private static normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map(val => val / norm);
  }

  /**
   * Validate embedding dimensions
   */
  private static validateEmbedding(embedding: number[]): boolean {
    return (
      Array.isArray(embedding) &&
      embedding.length === 512 && // ArcFace embedding size
      embedding.every(val => typeof val === 'number' && !isNaN(val))
    );
  }

  /**
   * Export all data (for persistence/backup)
   */
  static async exportData(): Promise<UserEmbedding[]> {
    try {
      const response = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 10000, // Adjust based on expected user count
        with_payload: true,
        with_vector: true,
      });

      return response.points.map(point => ({
        userId: point.payload?.userId as string,
        embedding: point.vector as number[],
        metadata: point.payload?.metadata as UserEmbedding['metadata'],
        score: point.payload?.score as number | undefined,
        vibeTags: point.payload?.vibeTags as string[] | undefined,
      }));
    } catch (error) {
      console.error('Error exporting data:', error);
      return [];
    }
  }

  /**
   * Import data (for initialization/restore)
   */
  static async importData(data: UserEmbedding[]): Promise<void> {
    try {
      const points = data
        .filter(userEmbedding => this.validateEmbedding(userEmbedding.embedding))
        .map(userEmbedding => ({
          id: userEmbedding.userId,
          vector: userEmbedding.embedding,
          payload: {
            userId: userEmbedding.userId,
            metadata: userEmbedding.metadata,
            score: userEmbedding.score,
            vibeTags: userEmbedding.vibeTags,
          },
        }));

      await qdrantClient.upsert(COLLECTION_NAME, {
        points,
      });

      await this.recalculateAllScores();
    } catch (error) {
      console.error('Error importing data:', error);
    }
  }
}