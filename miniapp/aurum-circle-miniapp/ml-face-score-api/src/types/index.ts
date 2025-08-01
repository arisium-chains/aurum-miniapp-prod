export interface FaceScoreRequest {
  imageData: string;
  userId?: string;
  sessionId?: string;
}

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

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
}

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
  resolution?: number;
  symmetry?: number;
}

export interface ProcessedFaceResult {
  success: boolean;
  data?: SimulatedMLResult;
  error?: string;
  jobId?: string;
}
