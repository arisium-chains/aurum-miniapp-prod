/**
 * @description ML API types migrated to use shared packages
 * @deprecated Old types are preserved for reference and backward compatibility
 * New implementations should use @shared/types
 */

// Import shared types
export type {
  FaceScoreRequest,
  FaceScoreResponse,
  ScoringRequest,
  ScoringResult,
  ProcessedFace,
  MLProcessingResult,
  SimulatedMLResult,
  ProcessedFaceResult,
  QueueJobResult,
  ValidationCriteria,
  MLAPIResponse,
  FaceDetectionResult,
  FaceEmbeddingResult,
  MLValidationResult,
} from '@shared/types';

// Import shared API types for standardized responses
export type { ApiResponse, ErrorResponse } from '@shared/types';

// [DEPRECATED: 2025-08-11] Old local types preserved for reference
// export interface FaceScoreRequest {
//   imageData: string;
//   userId?: string;
//   sessionId?: string;
// }

// export interface FaceScoreResponse {
//   score: number;
//   confidence: number;
//   features: {
//     symmetry: number;
//     clarity: number;
//     lighting: number;
//   };
//   processingTime: number;
//   timestamp: string;
// }

// export interface HealthResponse {
//   status: "healthy" | "unhealthy";
//   timestamp: string;
//   version: string;
//   uptime: number;
// }

// export interface ErrorResponse {
//   error: string;
//   message: string;
//   timestamp: string;
// }

// export interface SimulatedMLResult {
//   score: number;
//   confidence: number;
//   features: {
//     symmetry: number;
//     clarity: number;
//     lighting: number;
//     vibe?: number;
//   };
//   processingTime: number;
//   timestamp: string;
//   embedding?: number[];
//   quality?: number;
//   frontality?: number;
//   resolution?: string;
//   symmetry?: number;
// }

// export interface ProcessedFaceResult {
//   success: boolean;
//   data?: SimulatedMLResult;
//   error?: string;
//   jobId?: string;
// }

// [DEPRECATED: 2025-08-11] Local duplicate types moved to shared packages
// export interface QueueJobData {
//   imageBuffer: Buffer;
//   userId?: string;
//   sessionId?: string;
//   timestamp: number;
// }

// export interface ModelConfig {
//   name: string;
//   path: string;
//   inputShape: number[];
//   outputShape: number[];
//   inputName: string;
//   outputName: string;
// }

// Re-export shared types for compatibility
export type { QueueJobData, ModelConfig, RedisConfig } from '@shared/types';

/**
 * App-specific types that are not shared
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services?: {
    redis: boolean;
    queue: boolean;
    models: boolean;
  };
}
