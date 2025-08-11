/**
 * Model Loading Utilities
 * Handles downloading and caching of ML models
 */

interface ModelConfig {
  face_detection: {
    model_path: string;
    input_size: [number, number];
    confidence_threshold: number;
    backend: string;
  };
  face_embedding: {
    model_path: string;
    input_size: [number, number];
    output_size: number;
    backend: string;
  };
  version: string;
  last_updated: string;
}

export class ModelLoader {
  private static config: ModelConfig | null = null;

  static async loadConfig(): Promise<ModelConfig> {
    if (this.config) return this.config;

    try {
      const response = await fetch('/models/model_config.json');
      if (!response.ok) {
        throw new Error('Failed to load model configuration');
      }

      this.config = await response.json();
      if (!this.config) {
        throw new Error('Invalid model configuration received');
      }
      return this.config;
    } catch (error) {
      console.error('Model configuration loading failed:', error);

      // Fallback configuration
      this.config = {
        face_detection: {
          model_path:
            'https://tfhub.dev/mediapipe/tfjs-model/face_detection/short/1',
          input_size: [192, 192],
          confidence_threshold: 0.7,
          backend: 'webgl',
        },
        face_embedding: {
          model_path: 'https://tfhub.dev/tensorflow/tfjs-model/facenet/1',
          input_size: [160, 160],
          output_size: 128,
          backend: 'webgl',
        },
        version: '1.0.0-fallback',
        last_updated: new Date().toISOString(),
      };

      return this.config;
    }
  }

  static async checkModelAvailability(): Promise<{
    face_detection: boolean;
    face_embedding: boolean;
    overall: boolean;
  }> {
    const config = await this.loadConfig();

    const results = {
      face_detection: false,
      face_embedding: false,
      overall: false,
    };

    try {
      // Check face detection model
      const detectionResponse = await fetch(config.face_detection.model_path, {
        method: 'HEAD',
      });
      results.face_detection = detectionResponse.ok;

      // Check face embedding model
      const embeddingResponse = await fetch(config.face_embedding.model_path, {
        method: 'HEAD',
      });
      results.face_embedding = embeddingResponse.ok;

      results.overall = results.face_detection && results.face_embedding;
    } catch (error) {
      console.error('Model availability check failed:', error);
    }

    return results;
  }
}
