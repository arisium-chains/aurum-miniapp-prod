/**
 * Real Face Embedding Extraction using ArcFace/InsightFace
 * Production-ready facial feature embedding for similarity comparison
 */

import * as tf from '@tensorflow/tfjs'
import { RealFaceDetection, realFaceDetector } from './face-detection'

export interface RealFaceEmbedding {
  embedding: Float32Array // 512-dimensional ArcFace embedding
  confidence: number
  quality: number
  faceId: string // Unique identifier for this face
}

/**
 * Real ArcFace embedding extractor
 */
export class RealFaceEmbeddingExtractor {
  private arcFaceModel: tf.GraphModel | null = null
  private isInitialized = false
  
  // Pre-trained ArcFace model URLs
  private readonly MODEL_URLS = {
    // Option 1: ONNX.js model converted to TensorFlow.js
    arcface: '/models/arcface_r100_v1/model.json',
    
    // Option 2: InsightFace alternative
    insightface: '/models/buffalo_l/model.json',
    
    // Option 3: Public TensorFlow Hub model
    tfhub: 'https://tfhub.dev/tensorflow/tfjs-model/facenet/1'
  }
  
  private readonly EMBEDDING_SIZE = 512
  
  /**
   * Initialize the ArcFace model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      console.log('Loading ArcFace embedding model...')
      
      // Try loading models in order of preference
      for (const [name, url] of Object.entries(this.MODEL_URLS)) {
        try {
          console.log(`Attempting to load ${name} model from ${url}`)
          this.arcFaceModel = await tf.loadGraphModel(url)
          console.log(`Successfully loaded ${name} model`)
          break
        } catch (error) {
          console.warn(`Failed to load ${name} model:`, error)
          continue
        }
      }
      
      if (!this.arcFaceModel) {
        throw new Error('No face embedding model could be loaded')
      }
      
      // Warm up model with dummy input
      await this.warmupModel()
      
      this.isInitialized = true
      console.log('ArcFace model initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize ArcFace model:', error)
      throw new Error('Face embedding model initialization failed')
    }
  }
  
  /**
   * Extract face embedding from image
   */
  async extractEmbedding(
    imageData: ImageData | HTMLImageElement | HTMLCanvasElement,
    face?: RealFaceDetection
  ): Promise<RealFaceEmbedding | null> {
    if (!this.isInitialized || !this.arcFaceModel) {
      await this.initialize()
    }
    
    try {
      // Detect face if not provided
      let faceDetection = face
      if (!faceDetection) {
        const faces = await realFaceDetector.detectFaces(imageData)
        if (faces.length === 0) {
          return null
        }
        faceDetection = faces[0] // Use the first (highest confidence) face
      }
      
      // Extract and preprocess face crop
      const faceCrop = await this.preprocessFaceForEmbedding(imageData, faceDetection)
      
      // Extract embedding
      const embedding = await this.runInference(faceCrop)
      
      // Calculate quality score
      const imageElement = this.getImageDimensions(imageData)
      const quality = this.calculateEmbeddingQuality(faceDetection, embedding, imageElement)
      
      // Generate unique face ID
      const faceId = this.generateFaceId(embedding, faceDetection)
      
      // Cleanup
      faceCrop.dispose()
      
      return {
        embedding,
        confidence: faceDetection.confidence,
        quality,
        faceId
      }
      
    } catch (error) {
      console.error('Face embedding extraction failed:', error)
      throw new Error('Failed to extract face embedding')
    }
  }
  
  /**
   * Preprocess face crop for ArcFace model
   */
  private async preprocessFaceForEmbedding(
    imageData: ImageData | HTMLImageElement | HTMLCanvasElement,
    face: RealFaceDetection
  ): tf.Tensor {
    // ArcFace typically expects 112x112 aligned face crops
    const faceCrop = await realFaceDetector.extractFaceCrop(imageData, face, 112)
    
    // Normalize to [-1, 1] range (ArcFace standard)
    const normalized = faceCrop.div(127.5).sub(1.0)
    
    // Add batch dimension
    const batched = normalized.expandDims(0)
    
    // Cleanup intermediate tensors
    faceCrop.dispose()
    
    return batched
  }
  
  /**
   * Run ArcFace inference
   */
  private async runInference(faceTensor: tf.Tensor): Promise<Float32Array> {
    if (!this.arcFaceModel) {
      throw new Error('ArcFace model not initialized')
    }
    
    try {
      // Run inference
      const prediction = this.arcFaceModel.predict(faceTensor) as tf.Tensor
      
      // Get embedding data
      const embeddingData = await prediction.data() as Float32Array
      
      // L2 normalize the embedding (standard practice)
      const normalizedEmbedding = this.l2Normalize(embeddingData)
      
      // Cleanup
      prediction.dispose()
      
      return normalizedEmbedding
      
    } catch (error) {
      console.error('ArcFace inference failed:', error)
      throw new Error('Face embedding inference failed')
    }
  }
  
  /**
   * L2 normalize embedding vector
   */
  private l2Normalize(embedding: Float32Array): Float32Array {
    let norm = 0
    for (let i = 0; i < embedding.length; i++) {
      norm += embedding[i] * embedding[i]
    }
    norm = Math.sqrt(norm)
    
    if (norm === 0) {
      return embedding
    }
    
    const normalized = new Float32Array(embedding.length)
    for (let i = 0; i < embedding.length; i++) {
      normalized[i] = embedding[i] / norm
    }
    
    return normalized
  }
  
  /**
   * Calculate embedding quality score
   */
  private calculateEmbeddingQuality(
    face: RealFaceDetection,
    embedding: Float32Array,
    imageDims: { width: number, height: number }
  ): number {
    // Base quality from face detection
    const faceQuality = realFaceDetector.calculateFaceQuality(face, imageDims.width, imageDims.height)
    
    // Embedding magnitude (well-trained embeddings have consistent magnitude)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    const magnitudeScore = Math.min(1.0, magnitude) // Should be ~1.0 after normalization
    
    // Embedding diversity (avoid all-zero or all-same embeddings)
    const mean = embedding.reduce((sum, val) => sum + val, 0) / embedding.length
    const variance = embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / embedding.length
    const diversityScore = Math.min(1.0, variance * 10) // Higher variance = more diverse features
    
    // Combined quality score
    const overallQuality = (
      faceQuality.quality * 0.5 +
      magnitudeScore * 0.25 +
      diversityScore * 0.25
    )
    
    return Math.min(1.0, overallQuality)
  }
  
  /**
   * Generate unique face ID from embedding
   */
  private generateFaceId(embedding: Float32Array, face: RealFaceDetection): string {
    // Use first few embedding dimensions + face bbox for unique ID
    const hashInput = [
      ...Array.from(embedding.slice(0, 8)), // First 8 dimensions
      face.bbox.x,
      face.bbox.y,
      face.bbox.width,
      face.bbox.height
    ]
    
    // Simple hash function
    let hash = 0
    const str = hashInput.join(',')
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `face_${Math.abs(hash).toString(16)}`
  }
  
  /**
   * Get image dimensions
   */
  private getImageDimensions(imageData: ImageData | HTMLImageElement | HTMLCanvasElement): { width: number, height: number } {
    if (imageData instanceof ImageData) {
      return { width: imageData.width, height: imageData.height }
    } else {
      return { width: imageData.width, height: imageData.height }
    }
  }
  
  /**
   * Warm up model with dummy input
   */
  private async warmupModel(): Promise<void> {
    if (!this.arcFaceModel) return
    
    try {
      // Create dummy 112x112x3 input
      const dummyInput = tf.randomNormal([1, 112, 112, 3])
      
      // Run inference
      const output = this.arcFaceModel.predict(dummyInput) as tf.Tensor
      
      // Cleanup
      dummyInput.dispose()
      output.dispose()
      
      console.log('ArcFace model warmup completed')
      
    } catch (error) {
      console.warn('Model warmup failed:', error)
    }
  }
  
  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(embedding1: Float32Array, embedding2: Float32Array): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length')
    }
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }
    
    norm1 = Math.sqrt(norm1)
    norm2 = Math.sqrt(norm2)
    
    if (norm1 === 0 || norm2 === 0) {
      return 0
    }
    
    return dotProduct / (norm1 * norm2)
  }
  
  /**
   * Batch process multiple faces
   */
  async extractBatchEmbeddings(
    images: Array<{ data: ImageData | HTMLImageElement | HTMLCanvasElement, face?: RealFaceDetection }>
  ): Promise<Array<RealFaceEmbedding | null>> {
    const results: Array<RealFaceEmbedding | null> = []
    
    for (const image of images) {
      try {
        const embedding = await this.extractEmbedding(image.data, image.face)
        results.push(embedding)
      } catch (error) {
        console.error('Batch embedding extraction failed for image:', error)
        results.push(null)
      }
    }
    
    return results
  }
  
  /**
   * Dispose model and cleanup resources
   */
  dispose(): void {
    if (this.arcFaceModel) {
      this.arcFaceModel.dispose()
      this.arcFaceModel = null
    }
    this.isInitialized = false
  }
}

// Singleton instance
export const realFaceEmbeddingExtractor = new RealFaceEmbeddingExtractor()