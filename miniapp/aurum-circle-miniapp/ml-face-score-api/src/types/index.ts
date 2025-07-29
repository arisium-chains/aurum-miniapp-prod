// Types for the ML processing results

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
  // Add other properties as needed
}

export interface FaceEmbeddingResult {
  embedding: number[];
  quality: number;
  confidence: number;
  // Add other properties as needed
}

export interface ProcessedFaceResult {
  embedding: number[];
  quality: number;
  frontality: number;
  symmetry: number;
  resolution: number;
  confidence: number;
}

export interface SimulatedMLResult {
  score: number;
  vibe: string;
  rank: number;
}

export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  services?: {
    faceDetection: any;
    faceEmbedding: any;
  };
  error?: string;
}
