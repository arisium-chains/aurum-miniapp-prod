/**
 * Score Engine Abstraction
 * Provides a modular interface for different scoring models
 */

import { ProcessedFace } from "@/lib/face-embeddings";
import {
  mlModelIntegration,
  MLProcessingResult,
} from "@/lib/ml-models/model-integration";

export interface ScoreEngine {
  /**
   * Process an image and extract face embedding
   */
  processImage(
    imageBase64: string
  ): Promise<ProcessedFace | MLProcessingResult | null>;

  /**
   * Validate the processing result
   */
  validateResult(result: ProcessedFace | MLProcessingResult): {
    isValid: boolean;
    reason?: string;
  };

  /**
   * Check if the engine is healthy
   */
  healthCheck(): Promise<{ status: "healthy" | "unhealthy"; message?: string }>;
}

/**
 * TensorFlow.js Implementation
 */
export class TensorFlowScoreEngine implements ScoreEngine {
  async processImage(
    _imageBase64: string
  ): Promise<ProcessedFace | MLProcessingResult | null> {
    return await mlModelIntegration.processImage(_imageBase64);
  }

  validateResult(_result: ProcessedFace | MLProcessingResult): {
    isValid: boolean;
    reason?: string;
  } {
    return { isValid: true };
  }

  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    message?: string;
  }> {
    const health = await mlModelIntegration.healthCheck();
    // Map "degraded" status to "unhealthy" for the interface
    return {
      status: health.status === "healthy" ? "healthy" : "unhealthy",
      message: `Status: ${health.status}`,
    };
  }
}

/**
 * Future LLM/VLM Implementation Placeholder
 */
export class LLMScoreEngine implements ScoreEngine {
  async processImage(
    _imageBase64: string
  ): Promise<ProcessedFace | MLProcessingResult | null> {
    // Placeholder for future LLM/VLM implementation
    throw new Error("LLM/VLM scoring not yet implemented");
  }

  validateResult(_result: ProcessedFace | MLProcessingResult): {
    isValid: boolean;
    reason?: string;
  } {
    // Placeholder validation
    return { isValid: false, reason: "LLM/VLM scoring not yet implemented" };
  }

  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    message?: string;
  }> {
    // Placeholder health check
    return {
      status: "unhealthy",
      message: "LLM/VLM scoring not yet implemented",
    };
  }
}

/**
 * Factory to create score engines
 */
export class ScoreEngineFactory {
  static create(engineType: "tensorflow" | "llm"): ScoreEngine {
    switch (engineType) {
      case "tensorflow":
        return new TensorFlowScoreEngine();
      case "llm":
        return new LLMScoreEngine();
      default:
        throw new Error(`Unknown engine type: ${engineType}`);
    }
  }
}
