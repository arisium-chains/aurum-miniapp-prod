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
