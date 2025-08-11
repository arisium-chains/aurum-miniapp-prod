// [DEPRECATED: 2025-08-11] Legacy simulation-based service preserved for reference
// import { FaceScoreRequest, FaceScoreResponse } from '../types';
// import { logger, ProcessingError } from '@shared/utils';

import { FaceScoreRequest, FaceScoreResponse } from '../types';
import { logger, ProcessingError } from '@shared/utils';

/**
 * @description Legacy face scoring service with simulation logic
 * DEPRECATED: Replaced by advanced ONNX-based MLService
 */
class LegacyFaceScoreService {
  // [Previous simulation code preserved for reference]
  async scoreFace(imageData: string): Promise<FaceScoreResponse> {
    logger.warn(
      'Using deprecated simulation service. Consider upgrading to ONNX-based MLService'
    );

    // Simplified simulation fallback
    const score = Math.random() * 80 + 20;
    const confidence = Math.random() * 0.3 + 0.7;

    return {
      score: Math.round(score * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      features: {
        symmetry: Math.random() * 30 + 70,
        clarity: Math.random() * 40 + 60,
        lighting: Math.random() * 40 + 60,
      },
      processingTime: 100,
      timestamp: new Date().toISOString(),
    };
  }
}

export const legacyFaceScoreService = new LegacyFaceScoreService();

// Export legacy service as default for backward compatibility
export const faceScoreService = legacyFaceScoreService;
