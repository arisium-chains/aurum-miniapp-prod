/**
 * ML Model Integration Layer
 * Coordinates real ML models for production face analysis
 */

import { realFaceDetector, RealFaceDetection } from './face-detection'
import { realFaceEmbeddingExtractor, RealFaceEmbedding } from './face-embeddings'

export interface MLProcessingResult {
  embedding: Float32Array
  quality: number
  frontality: number
  symmetry: number
  resolution: number
  confidence: number
  faceId: string
  detectionData: RealFaceDetection
}

export interface MLValidationResult {
  isValid: boolean
  reason?: string
  quality: {
    face: number
    embedding: number
    overall: number
  }
}

/**
 * Production ML pipeline for face analysis
 */
export class MLModelIntegration {
  private isInitialized = false
  
  /**
   * Initialize all ML models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      console.log('Initializing ML models...')
      
      // Initialize models in parallel
      await Promise.all([
        realFaceDetector.initialize(),
        realFaceEmbeddingExtractor.initialize()
      ])
      
      this.isInitialized = true
      console.log('All ML models initialized successfully')
      
    } catch (error) {
      console.error('ML model initialization failed:', error)
      throw new Error('Failed to initialize ML models')
    }
  }
  
  /**
   * Process image through complete ML pipeline
   */
  async processImage(imageBase64: string): Promise<MLProcessingResult | null> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    try {
      // Convert base64 to image
      const imageElement = await this.base64ToImage(imageBase64)
      
      // Step 1: Detect faces
      const faces = await realFaceDetector.detectFaces(imageElement)
      
      if (faces.length === 0) {
        throw new Error('No face detected in image')
      }
      
      // Use the highest confidence face
      const bestFace = faces.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      )
      
      // Step 2: Extract embedding
      const embeddingResult = await realFaceEmbeddingExtractor.extractEmbedding(
        imageElement, 
        bestFace
      )
      
      if (!embeddingResult) {
        throw new Error('Failed to extract face embedding')
      }
      
      // Step 3: Calculate quality metrics
      const qualityMetrics = realFaceDetector.calculateFaceQuality(
        bestFace, 
        imageElement.width, 
        imageElement.height
      )
      
      return {
        embedding: embeddingResult.embedding,
        quality: embeddingResult.quality,
        frontality: qualityMetrics.frontality,
        symmetry: qualityMetrics.symmetry,
        resolution: qualityMetrics.resolution,
        confidence: embeddingResult.confidence,
        faceId: embeddingResult.faceId,
        detectionData: bestFace
      }
      
    } catch (error) {
      console.error('ML processing failed:', error)
      throw error
    }
  }
  
  /**
   * Validate processing result meets quality standards
   */
  validateResult(result: MLProcessingResult): MLValidationResult {
    const { quality, frontality, symmetry, resolution, confidence } = result
    
    // Quality thresholds for production
    const THRESHOLDS = {
      minQuality: 0.6,
      minFrontality: 0.5,
      minSymmetry: 0.4,
      minResolution: 0.4,
      minConfidence: 0.7
    }
    
    const qualityScores = {
      face: (frontality + symmetry + resolution) / 3,
      embedding: quality,
      overall: (quality + frontality + symmetry + resolution + confidence) / 5
    }
    
    // Check individual criteria
    const failedCriteria: string[] = []
    
    if (quality < THRESHOLDS.minQuality) {
      failedCriteria.push(`Embedding quality too low: ${(quality * 100).toFixed(1)}%`)
    }
    
    if (frontality < THRESHOLDS.minFrontality) {
      failedCriteria.push(`Face not frontal enough: ${(frontality * 100).toFixed(1)}%`)
    }
    
    if (symmetry < THRESHOLDS.minSymmetry) {
      failedCriteria.push(`Face symmetry too low: ${(symmetry * 100).toFixed(1)}%`)
    }
    
    if (resolution < THRESHOLDS.minResolution) {
      failedCriteria.push(`Face resolution too low: ${(resolution * 100).toFixed(1)}%`)
    }
    
    if (confidence < THRESHOLDS.minConfidence) {
      failedCriteria.push(`Detection confidence too low: ${(confidence * 100).toFixed(1)}%`)
    }
    
    const isValid = failedCriteria.length === 0
    const reason = failedCriteria.length > 0 ? failedCriteria.join('; ') : undefined
    
    return {
      isValid,
      reason,
      quality: qualityScores
    }
  }
  
  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: Float32Array, embedding2: Float32Array): number {
    return realFaceEmbeddingExtractor.constructor.cosineSimilarity(embedding1, embedding2)
  }
  
  /**
   * Batch process multiple images
   */
  async processImageBatch(imageBase64Array: string[]): Promise<Array<MLProcessingResult | null>> {
    const results: Array<MLProcessingResult | null> = []
    
    // Process in small batches to avoid memory issues
    const batchSize = 5
    
    for (let i = 0; i < imageBase64Array.length; i += batchSize) {
      const batch = imageBase64Array.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (imageBase64) => {
        try {
          return await this.processImage(imageBase64)
        } catch (error) {
          console.error('Batch processing failed for image:', error)
          return null
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }
  
  /**
   * Get model information and status
   */
  getModelInfo(): {
    initialized: boolean
    models: {
      faceDetection: boolean
      faceEmbedding: boolean
    }
    version: string
  } {
    return {
      initialized: this.isInitialized,
      models: {
        faceDetection: realFaceDetector['isInitialized'] || false,
        faceEmbedding: realFaceEmbeddingExtractor['isInitialized'] || false
      },
      version: '1.0.0'
    }
  }
  
  /**
   * Convert base64 to HTMLImageElement
   */
  private async base64ToImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => resolve(img)
      img.onerror = (error) => reject(new Error('Failed to load image'))
      
      // Add data URL prefix if not present
      const dataUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
      img.src = dataUrl
    })
  }
  
  /**
   * Cleanup all models
   */
  dispose(): void {
    realFaceDetector.dispose()
    realFaceEmbeddingExtractor.dispose()
    this.isInitialized = false
  }
  
  /**
   * Health check for all models
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: {
      faceDetection: boolean
      faceEmbedding: boolean
      overall: boolean
    }
    latency?: number
  }> {
    try {
      // First check if models are initialized without processing
      const modelInfo = this.getModelInfo()
      
      // If not initialized, try a quick initialization check
      if (!this.isInitialized) {
        try {
          await this.initialize()
        } catch (error) {
          console.warn('ML models not available:', error)
          return {
            status: 'unhealthy',
            details: {
              faceDetection: false,
              faceEmbedding: false,
              overall: false
            }
          }
        }
      }
      
      const startTime = Date.now()
      
      // Simple model availability check instead of full processing
      const details = {
        faceDetection: modelInfo.models.faceDetection,
        faceEmbedding: modelInfo.models.faceEmbedding,
        overall: modelInfo.initialized && modelInfo.models.faceDetection && modelInfo.models.faceEmbedding
      }
      
      const latency = Date.now() - startTime
      
      let status: 'healthy' | 'degraded' | 'unhealthy'
      if (details.overall) {
        status = 'healthy'
      } else if (details.faceDetection || details.faceEmbedding) {
        status = 'degraded'
      } else {
        status = 'unhealthy'
      }
      
      return { status, details, latency }
      
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        status: 'unhealthy',
        details: {
          faceDetection: false,
          faceEmbedding: false,
          overall: false
        }
      }
    }
  }
}

// Singleton instance
export const mlModelIntegration = new MLModelIntegration()

// Initialize only on explicit request
// Don't auto-initialize to avoid failures when models aren't set up
console.log('ML models will initialize on first use when real ML is requested')