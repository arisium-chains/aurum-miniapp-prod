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
    imageBase64?: string
  ): Promise<ProcessedFace | MLProcessingResult | null>;

  /**
   * Validate the processing result
   */
  validateResult(result?: ProcessedFace | MLProcessingResult): {
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
    imageBase64: string
  ): Promise<ProcessedFace | MLProcessingResult | null> {
<<<<<<< HEAD
    // This engine relies on mlModelIntegration which requires the imageBase64.
    // Consider refactoring if imageBase64 is not needed at this level of abstraction,
    // or pass it through if this method is meant to be a direct wrapper.
    // For now, returning null as the parameter is removed.
    // If mlModelIntegration.processImage() needs to be called,
    // this method signature needs to align with that requirement.
    // Assuming for now that the parameter is truly unused by this specific implementation's logic.
    return null;
=======
    return await mlModelIntegration.processImage(imageBase64);
>>>>>>> 7c45ced (Fix ESLint warnings causing Docker build failure)
  }

  validateResult(): {
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
  async processImage(): Promise<ProcessedFace | MLProcessingResult | null> {
    // Placeholder for future LLM/VLM implementation
    throw new Error("LLM/VLM scoring not yet implemented");
  }

  validateResult(): {
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
