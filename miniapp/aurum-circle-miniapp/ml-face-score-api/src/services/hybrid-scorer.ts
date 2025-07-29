import * as ort from "onnxruntime-node";
import { processImage as simulatedProcessImage } from "./scorer";

interface ProcessedFaceResult {
  embedding: number[];
  quality: number;
  frontality: number;
  symmetry: number;
  resolution: number;
  confidence: number;
}

interface SimulatedMLResult {
  embedding: number[];
  quality: number;
  frontality: number;
  symmetry: number;
  resolution: number;
  confidence: number;
}

interface FaceDetectionResult {
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

interface FaceEmbeddingResult {
  embedding: number[];
  quality: number;
  confidence: number;
}

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
        // Load ONNX models
        const faceDetectionModelPath =
          "./models/face_detection/face_detection.onnx";
        const faceEmbeddingModelPath = "./models/arcface/arcface.onnx";

        const faceDetectionSession = await ort.InferenceSession.create(
          faceDetectionModelPath
        );
        const faceEmbeddingSession = await ort.InferenceSession.create(
          faceEmbeddingModelPath
        );

        // Convert base64 to Uint8Array
        const imageBuffer = Buffer.from(imageBase64, "base64");
        const imageData = new Uint8Array(imageBuffer);

        // Prepare input for face detection
        const faceDetectionInput = new ort.Tensor(
          "float32",
          new Float32Array(imageData),
          [1, 3, 224, 224]
        ); // Example shape

        // Run face detection
        const faceDetectionResults = await faceDetectionSession.run({
          input: faceDetectionInput,
        });

        if (
          !faceDetectionResults ||
          !faceDetectionResults.output ||
          faceDetectionResults.output.data.length === 0
        ) {
          throw new Error("No faces detected");
        }

        // Get the first face
        const face: FaceDetectionResult = this.extractFace(
          faceDetectionResults.output.data
        );

        // Prepare input for face embedding
        const faceEmbeddingInput = new ort.Tensor(
          "float32",
          new Float32Array(imageData),
          [1, 3, 112, 112]
        ); // Example shape

        // Run face embedding
        const faceEmbeddingResults = await faceEmbeddingSession.run({
          input: faceEmbeddingInput,
        });

        if (
          !faceEmbeddingResults ||
          !faceEmbeddingResults.output ||
          faceEmbeddingResults.output.data.length === 0
        ) {
          throw new Error("No face embedding extracted");
        }

        const embeddingData = faceEmbeddingResults.output.data;
        const embedding: number[] = [];
        for (let i = 0; i < embeddingData.length; i++) {
          embedding.push(Number(embeddingData[i]));
        }
        const quality = 0.9; // Placeholder
        const confidence = 0.9; // Placeholder

        return {
          embedding: embedding,
          quality: quality,
          frontality: this.calculateFrontality(face),
          symmetry: this.calculateSymmetry(face),
          resolution: this.calculateResolution(face, imageBase64),
          confidence: confidence,
        };
      } catch (error: any) {
        console.warn(
          "ONNX ML services unavailable, falling back to simulated ML:",
          error.message
        );
      }
    }

    // Fallback to simulated ML
    // Convert base64 to a temporary file path for the existing simulated function
    return await simulatedProcessImage("temp_image_path");
  }

  private calculateFrontality(face: FaceDetectionResult): number {
    // Calculate frontality based on facial landmarks
    // This is a simplified implementation
    if (face && face.landmarks) {
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
    if (face && face.landmarks && face.landmarks.nose && face.bbox) {
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
    if (face && face.bbox) {
      const faceArea = face.bbox.width * face.bbox.height;
      const imageSize = imageBase64.length;

      const resolution = Math.min(1.0, faceArea / 10000 + imageSize / 1000000);
      return Math.max(0.1, resolution); // Ensure minimum value
    }

    // Default value if bbox is not available
    return 0.75;
  }

  private extractFace(data: any): FaceDetectionResult {
    // Extract face data from face detection results
    // This is a placeholder implementation
    const faceData: FaceDetectionResult = {
      bbox: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      landmarks: {
        left_eye: [0, 0],
        right_eye: [0, 0],
        nose: [0, 0],
        left_mouth: [0, 0],
        right_mouth: [0, 0],
      },
      confidence: 0.9,
    };
    return faceData;
  }
}

// Export a singleton instance
export const hybridScorer = new HybridScorer();
