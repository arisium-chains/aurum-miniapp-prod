export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  services: {
    redis: boolean;
    queue: boolean;
    models: boolean;
  };
  version: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ScoringRequest {
  image: Buffer;
  userId?: string;
  sessionId?: string;
}

export interface ScoringResult {
  score: number;
  confidence: number;
  processingTime: number;
  faceDetected: boolean;
  faceCount: number;
  embeddings?: number[];
}

export interface QueueJobData {
  imageBuffer: Buffer;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

export interface QueueJobResult {
  success: boolean;
  result?: ScoringResult;
  error?: string;
  processingTime: number;
}

export interface ModelConfig {
  name: string;
  path: string;
  inputShape: number[];
  outputShape: number[];
  inputName: string;
  outputName: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface LoggerConfig {
  level: string;
  dir: string;
}
