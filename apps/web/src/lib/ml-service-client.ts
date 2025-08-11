/**
 * ML Service Client
 * Client for communicating with the standalone ML API service
 * Replaces direct browser-based ML processing with server-side processing
 */

import {
  MLProcessingResult,
  MLValidationResult,
} from './ml-models/model-integration';

export interface MLServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * Response types from ML service
 */
export interface MLServiceHealthResponse {
  status: 'success' | 'error';
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      faceDetection: boolean;
      faceEmbedding: boolean;
      attractiveness: boolean;
      overall: boolean;
    };
    models: {
      loaded: string[];
      failed: string[];
      totalMemoryUsage: string;
    };
    performance: {
      avgProcessingTime: number;
      successRate: number;
      totalProcessed: number;
    };
    queue?: {
      active: number;
      waiting: number;
      completed: number;
      failed: number;
    };
  };
  message: string;
  timestamp: string;
}

export interface MLServiceInfoResponse {
  status: 'success' | 'error';
  data: {
    initialized: boolean;
    models: {
      faceDetection: boolean;
      faceEmbedding: boolean;
      attractiveness: boolean;
    };
    version: string;
    config: {
      batchSize: number;
      queueConcurrency: number;
      modelPaths: Record<string, string>;
    };
  };
  message: string;
}

export interface MLServiceProcessResponse {
  status: 'success' | 'error';
  data: {
    jobId: string;
    result: {
      faceDetected: boolean;
      embedding: number[];
      attractivenessScore: number;
      qualityMetrics: {
        faceQuality: number;
        frontality: number;
        symmetry: number;
        resolution: number;
        confidence: number;
      };
      processing: {
        processingTime: number;
        modelVersions: Record<string, string>;
        timestamp: string;
      };
    };
  };
  message: string;
}

/**
 * Client for the standalone ML API service
 */
export class MLServiceClient {
  private config: MLServiceConfig;

  constructor(config?: Partial<MLServiceConfig>) {
    this.config = {
      baseUrl: process.env.ML_API_URL || 'http://localhost:3003',
      timeout: 30000, // 30 seconds
      retries: 3,
      ...config,
    };
  }

  /**
   * Check health status of ML service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      faceDetection: boolean;
      faceEmbedding: boolean;
      overall: boolean;
    };
    latency?: number;
  }> {
    try {
      const startTime = Date.now();

      const response = await this.makeRequest<MLServiceHealthResponse>(
        '/health',
        { method: 'GET' }
      );

      const latency = Date.now() - startTime;

      if (response.status === 'success') {
        return {
          status: response.data.status,
          details: {
            faceDetection: response.data.details.faceDetection,
            faceEmbedding: response.data.details.faceEmbedding,
            overall: response.data.details.overall,
          },
          latency,
        };
      } else {
        return {
          status: 'unhealthy',
          details: {
            faceDetection: false,
            faceEmbedding: false,
            overall: false,
          },
          latency,
        };
      }
    } catch (error) {
      console.error('ML service health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          faceDetection: false,
          faceEmbedding: false,
          overall: false,
        },
      };
    }
  }

  /**
   * Get model information and status
   */
  getModelInfo(): {
    initialized: boolean;
    models: {
      faceDetection: boolean;
      faceEmbedding: boolean;
    };
    version: string;
  } {
    // Return optimistic defaults - actual status checked via healthCheck
    return {
      initialized: true,
      models: {
        faceDetection: true,
        faceEmbedding: true,
      },
      version: '2.0.0', // New ML service version
    };
  }

  /**
   * Get detailed model information from service
   */
  async getDetailedModelInfo(): Promise<MLServiceInfoResponse['data'] | null> {
    try {
      const response = await this.makeRequest<MLServiceInfoResponse>(
        '/models/info',
        { method: 'GET' }
      );

      return response.status === 'success' ? response.data : null;
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }

  /**
   * Process image through ML pipeline
   */
  async processImage(imageBase64: string): Promise<MLProcessingResult | null> {
    try {
      const response = await this.makeRequest<MLServiceProcessResponse>(
        '/process/single',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageBase64,
            options: {
              extractEmbedding: true,
              calculateAttractiveness: true,
              validateQuality: true,
            },
          }),
        }
      );

      if (response.status === 'success' && response.data.result.faceDetected) {
        const result = response.data.result;

        // Convert to the expected MLProcessingResult format
        return {
          embedding: new Float32Array(result.embedding),
          quality: result.qualityMetrics.faceQuality,
          frontality: result.qualityMetrics.frontality,
          symmetry: result.qualityMetrics.symmetry,
          resolution: result.qualityMetrics.resolution,
          confidence: result.qualityMetrics.confidence,
          faceId: response.data.jobId, // Use job ID as face ID
          detectionData: {
            // Minimal detection data - not used by current consumers
            confidence: result.qualityMetrics.confidence,
            box: { x: 0, y: 0, width: 0, height: 0 }, // Placeholder
          } as any,
        };
      } else {
        throw new Error('No face detected in image');
      }
    } catch (error) {
      console.error('ML processing failed:', error);
      throw new Error('ML processing failed');
    }
  }

  /**
   * Batch process multiple images
   */
  async processImageBatch(
    imageBase64Array: string[]
  ): Promise<Array<MLProcessingResult | null>> {
    try {
      const response = await this.makeRequest<{
        status: 'success' | 'error';
        data: {
          jobId: string;
          results: Array<{
            success: boolean;
            result?: MLServiceProcessResponse['data']['result'];
            error?: string;
          }>;
        };
        message: string;
      }>('/process/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageBase64Array.map((image, index) => ({
            id: `batch_${index}`,
            image,
          })),
          options: {
            extractEmbedding: true,
            calculateAttractiveness: true,
            validateQuality: true,
          },
        }),
      });

      if (response.status === 'success') {
        return response.data.results.map((result, index) => {
          if (result.success && result.result?.faceDetected) {
            const r = result.result;
            return {
              embedding: new Float32Array(r.embedding),
              quality: r.qualityMetrics.faceQuality,
              frontality: r.qualityMetrics.frontality,
              symmetry: r.qualityMetrics.symmetry,
              resolution: r.qualityMetrics.resolution,
              confidence: r.qualityMetrics.confidence,
              faceId: `${response.data.jobId}_${index}`,
              detectionData: {
                confidence: r.qualityMetrics.confidence,
                box: { x: 0, y: 0, width: 0, height: 0 },
              } as any,
            };
          }
          return null;
        });
      } else {
        throw new Error('Batch processing failed');
      }
    } catch (error) {
      console.error('Batch processing failed:', error);
      return imageBase64Array.map(() => null);
    }
  }

  /**
   * Validate processing result meets quality standards
   */
  validateResult(result: MLProcessingResult): MLValidationResult {
    const { quality, frontality, symmetry, resolution, confidence } = result;

    // Quality thresholds for production (same as original)
    const THRESHOLDS = {
      minQuality: 0.6,
      minFrontality: 0.5,
      minSymmetry: 0.4,
      minResolution: 0.4,
      minConfidence: 0.7,
    };

    const qualityScores = {
      face: (frontality + symmetry + resolution) / 3,
      embedding: quality,
      overall: (quality + frontality + symmetry + resolution + confidence) / 5,
    };

    // Check individual criteria
    const failedCriteria: string[] = [];

    if (quality < THRESHOLDS.minQuality) {
      failedCriteria.push(
        `Embedding quality too low: ${(quality * 100).toFixed(1)}%`
      );
    }

    if (frontality < THRESHOLDS.minFrontality) {
      failedCriteria.push(
        `Face not frontal enough: ${(frontality * 100).toFixed(1)}%`
      );
    }

    if (symmetry < THRESHOLDS.minSymmetry) {
      failedCriteria.push(
        `Face symmetry too low: ${(symmetry * 100).toFixed(1)}%`
      );
    }

    if (resolution < THRESHOLDS.minResolution) {
      failedCriteria.push(
        `Face resolution too low: ${(resolution * 100).toFixed(1)}%`
      );
    }

    if (confidence < THRESHOLDS.minConfidence) {
      failedCriteria.push(
        `Detection confidence too low: ${(confidence * 100).toFixed(1)}%`
      );
    }

    const isValid = failedCriteria.length === 0;
    const reason =
      failedCriteria.length > 0 ? failedCriteria.join('; ') : undefined;

    return {
      isValid,
      reason,
      quality: qualityScores,
    };
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(
    embedding1: Float32Array,
    embedding2: Float32Array
  ): number {
    // Calculate cosine similarity (same as original)
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Initialize the ML service (compatibility method)
   */
  async initialize(): Promise<void> {
    // Check if service is available
    const health = await this.healthCheck();
    if (health.status === 'unhealthy') {
      throw new Error('ML service is not available');
    }
  }

  /**
   * Cleanup (compatibility method)
   */
  dispose(): void {
    // No cleanup needed for HTTP client
    console.log('ML service client disposed');
  }

  /**
   * Make HTTP request to ML service with retries
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`ML service request attempt ${attempt} failed:`, error);

        if (attempt < this.config.retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('ML service request failed');
  }
}

// Export singleton instance
export const mlServiceClient = new MLServiceClient();

// Legacy compatibility - gradual migration path
export const mlModelIntegration = mlServiceClient;
