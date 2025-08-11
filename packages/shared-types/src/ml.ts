/**
 * @description ML scoring and face processing interfaces used across all services
 */

/**
 * Face detection result from ML processing
 */
export interface FaceDetectionResult {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: {
    left_eye: [number, number];
    right_eye: [number, number];
    nose: [number, number];
    left_mouth: [number, number];
    right_mouth: [number, number];
  };
  confidence: number;
}

/**
 * Face embedding extraction result
 */
export interface FaceEmbeddingResult {
  embedding: number[];
  quality: number;
  confidence: number;
}

/**
 * Processed face data with all ML metrics
 */
export interface ProcessedFace {
  embedding: number[];
  quality: number;
  frontality: number;
  symmetry: number;
  resolution: number;
  confidence?: number;
  faceId?: string;
}

/**
 * Extended ML processing result with detection data
 */
export interface MLProcessingResult extends ProcessedFace {
  detectionData: FaceDetectionResult;
}

/**
 * ML validation result for quality checks
 */
export interface MLValidationResult {
  isValid: boolean;
  reason?: string;
  quality: {
    face: number;
    embedding: number;
    overall: number;
  };
}

/**
 * Face scoring request payload
 */
export interface FaceScoreRequest {
  imageData: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Face scoring response from ML service
 */
export interface FaceScoreResponse {
  score: number;
  confidence: number;
  features: {
    symmetry: number;
    clarity: number;
    lighting: number;
  };
  processingTime: number;
  timestamp: string;
}

/**
 * Scoring request with metadata
 */
export interface ScoringRequest {
  userId: string;
  imageBase64: string;
  metadata?: {
    nftVerified?: boolean;
    wldVerified?: boolean;
    timestamp?: string;
  };
}

/**
 * Comprehensive scoring result with percentile data
 */
export interface ScoringResult {
  score: number;
  percentile: number;
  vibeTags: string[];
  timestamp: string;
  metadata: {
    faceQuality: number;
    frontality: number;
    symmetry: number;
    resolution: number;
    totalUsers: number;
    userRank: number;
    confidence: number;
  };
  distribution?: ScoreDistribution;
  faceDetected?: boolean;
  faceCount?: number;
  embeddings?: number[];
  processingTime?: number;
}

/**
 * Score distribution statistics
 */
export interface ScoreDistribution {
  mean: number;
  std: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

/**
 * Simulated ML result for development/testing
 */
export interface SimulatedMLResult {
  score: number;
  confidence: number;
  features: {
    symmetry: number;
    clarity: number;
    lighting: number;
    vibe?: number;
  };
  processingTime: number;
  timestamp: string;
  embedding?: number[];
  quality?: number;
  frontality?: number;
  resolution?: string;
  symmetry?: number;
}

/**
 * ML API response wrapper
 */
export interface MLAPIResponse {
  score: number;
  vibe: string;
  rank: number;
  embedding?: number[];
  quality?: number;
  frontality?: number;
  symmetry?: number;
  resolution?: number;
  confidence?: number;
  faceId?: string;
}

/**
 * Processed face result with job handling
 */
export interface ProcessedFaceResult {
  success: boolean;
  data?: SimulatedMLResult;
  error?: string;
  jobId?: string;
}

/**
 * Validation criteria for ML processing
 */
export interface ValidationCriteria {
  minQuality: number;
  minFrontality: number;
  minSymmetry: number;
  minResolution: number;
  minConfidence: number;
}

/**
 * Queue job result for batch processing
 */
export interface QueueJobResult {
  success: boolean;
  result?: ScoringResult;
  error?: string;
  processingTime: number;
}

/**
 * Queue job data for processing requests
 */
export interface QueueJobData {
  imageBuffer: Buffer;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

/**
 * Model configuration interface
 */
export interface ModelConfig {
  name: string;
  path: string;
  inputShape: number[];
  outputShape: number[];
  inputName: string;
  outputName: string;
}
