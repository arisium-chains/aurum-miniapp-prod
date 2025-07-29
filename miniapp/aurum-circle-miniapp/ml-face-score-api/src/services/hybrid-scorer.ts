import { rustMLClient } from "./rust-ml-client";
import { processImage as simulatedProcessImage } from "./scorer";
import {
  ProcessedFaceResult,
  SimulatedMLResult,
  FaceDetectionResult,
  FaceEmbeddingResult,
} from "../types";

export class HybridScorer {
  private useRealML: boolean;

  constructor() {
    this.useRealML = process.env.USE_REAL_ML !== "false";
  }

  async processImage(
    imageBase64: string
  ): Promise<ProcessedFaceResult | SimulatedMLResult> {
    // Try real ML first if enabled
    if (this.useRealML) {
      try {
        // Check if Rust services are healthy
        const health = await rustMLClient.healthCheck();
        if (health.status === "healthy") {
          // Use Rust services
          const faces = await rustMLClient.detectFaces(imageBase64);
          if (faces.length === 0) {
            throw new Error("No faces detected");
          }

          const face = faces[0]; // Use first face
          const embedding = await rustMLClient.extractEmbedding(imageBase64);

          return {
            embedding: embedding.embedding,
            quality: embedding.quality,
            frontality: this.calculateFrontality(face),
            symmetry: this.calculateSymmetry(face),
            resolution: this.calculateResolution(face, imageBase64),
            confidence: embedding.confidence,
          };
        }
      } catch (error: any) {
        console.warn(
          "Rust ML services unavailable, falling back to simulated ML:",
          error.message
        );
      }
    }

    // Fallback to simulated ML
    // Convert base64 to a temporary file path for the existing simulated function
    // In a real implementation, we would need to handle this properly
    return await simulatedProcessImage("temp_image_path");
  }

  private calculateFrontality(face: FaceDetectionResult): number {
    // Calculate frontality based on facial landmarks
    // This is a simplified implementation
    if (face.landmarks) {
      const leftEye = face.landmarks.left_eye;
      const rightEye = face.landmarks.right_eye;

      if (leftEye && rightEye) {
        const eyeHeightDiff = Math.abs(leftEye[1] - rightEye[1]);
        const frontality = 1.0 - Math.min(1.0, eyeHeightDiff / 100);
        return Math.max(0.1, frontality); // Ensure minimum value
      }
    }

    // Default value if landmarks are not available
    return 0.8;
  }

  private calculateSymmetry(face: FaceDetectionResult): number {
    // Calculate symmetry based on facial landmarks
    // This is a simplified implementation
    if (face.landmarks && face.landmarks.nose && face.bbox) {
      const faceCenterX = face.bbox.x + face.bbox.width / 2;
      const noseDeviation = Math.abs(face.landmarks.nose[0] - faceCenterX);
      const symmetry = 1.0 - Math.min(1.0, noseDeviation / 50);
      return Math.max(0.1, symmetry); // Ensure minimum value
    }

    // Default value if landmarks are not available
    return 0.85;
  }

  private calculateResolution(
    face: FaceDetectionResult,
    imageBase64: string
  ): number {
    // Estimate resolution based on face size and image data
    if (face.bbox) {
      const faceArea = face.bbox.width * face.bbox.height;
      const imageSize = imageBase64.length;

      const resolution = Math.min(1.0, faceArea / 10000 + imageSize / 1000000);
      return Math.max(0.1, resolution); // Ensure minimum value
    }

    // Default value if bbox is not available
    return 0.75;
  }
}

// Export a singleton instance
export const hybridScorer = new HybridScorer();
