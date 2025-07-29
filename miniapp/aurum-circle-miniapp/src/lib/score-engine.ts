/**
 * Score Engine Abstraction
 * Provides a modular interface for different scoring models
 */

import { ProcessedFace } from '@/lib/face-embeddings';
import { mlModelIntegration, MLProcessingResult } from '@/lib/ml-models/model-integration';

export interface ScoreEngine {
  /**
   * Process an image and extract face embedding
   */
  processImage(imageBase64: string): Promise<ProcessedFace | MLProcessingResult | null>;
  
  /**
   * Validate the processing result
   */
  validateResult(result: ProcessedFace | MLProcessingResult): { 
    isValid: boolean; 
    reason?: string 
  };
  
  /**
   * Check if the engine is healthy
   */
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }>;
}

/**
 * TensorFlow.js Implementation
 */
export class TensorFlowScoreEngine implements ScoreEngine {
  async processImage(imageBase64: string): Promise<ProcessedFace | MLProcessingResult | null> {
    return await mlModelIntegration.processImage(imageBase64);
  }
  
  validateResult(result: ProcessedFace | MLProcessingResult): { 
    isValid: boolean; 
    reason?: string 
  } {
    return mlModelIntegration.validateResult(result);
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    return await mlModelIntegration.healthCheck();
  }
}

/**
 * Future LLM/VLM Implementation Placeholder
 */
export class LLMScoreEngine implements ScoreEngine {
  async processImage(imageBase64: string): Promise<ProcessedFace | MLProcessingResult | null> {
    // Placeholder for future LLM/VLM implementation
    throw new Error('LLM/VLM scoring not yet implemented');
  }
  
  validateResult(result: ProcessedFace | MLProcessingResult): { 
    isValid: boolean; 
    reason?: string 
  } {
    // Placeholder validation
    return { isValid: false, reason: 'LLM/VLM scoring not yet implemented' };
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    // Placeholder health check
    return { status: 'unhealthy', message: 'LLM/VLM scoring not yet implemented' };
  }
}

/**
 * Factory to create score engines
 */
export class ScoreEngineFactory {
  static create(engineType: 'tensorflow' | 'llm'): ScoreEngine {
    switch (engineType) {
      case 'tensorflow':
        return new TensorFlowScoreEngine();
      case 'llm':
        return new LLMScoreEngine();
      default:
        throw new Error(`Unknown engine type: ${engineType}`);
    }
  }
}