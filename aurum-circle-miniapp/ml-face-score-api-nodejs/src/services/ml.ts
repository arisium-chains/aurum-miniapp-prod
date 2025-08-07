import * as ort from "onnxruntime-node";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { ScoringResult, ModelConfig } from "@/types";

export class MLService {
  private faceDetectionSession: ort.InferenceSession | null = null;
  private faceEmbeddingSession: ort.InferenceSession | null = null;
  private attractivenessSession: ort.InferenceSession | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      logger.info("Initializing ML models...");

      const modelsDir = config.models.path;

      // Ensure models directory exists
      await fs.mkdir(modelsDir, { recursive: true });

      // Initialize face detection model
      const faceDetectionPath = path.join(
        modelsDir,
        config.models.faceDetection
      );
      if (await this.fileExists(faceDetectionPath)) {
        this.faceDetectionSession = await ort.InferenceSession.create(
          faceDetectionPath
        );
        logger.info("Face detection model loaded");
      } else {
        logger.warn(`Face detection model not found at ${faceDetectionPath}`);
      }

      // Initialize face embedding model
      const faceEmbeddingPath = path.join(
        modelsDir,
        config.models.faceEmbedding
      );
      if (await this.fileExists(faceEmbeddingPath)) {
        this.faceEmbeddingSession = await ort.InferenceSession.create(
          faceEmbeddingPath
        );
        logger.info("Face embedding model loaded");
      } else {
        logger.warn(`Face embedding model not found at ${faceEmbeddingPath}`);
      }

      // Initialize attractiveness model
      const attractivenessPath = path.join(
        modelsDir,
        config.models.attractiveness
      );
      if (await this.fileExists(attractivenessPath)) {
        this.attractivenessSession = await ort.InferenceSession.create(
          attractivenessPath
        );
        logger.info("Attractiveness model loaded");
      } else {
        logger.warn(`Attractiveness model not found at ${attractivenessPath}`);
      }

      this.isInitialized = true;
      logger.info("ML models initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize ML models:", error);
      throw error;
    }
  }

  async processImage(imageBuffer: Buffer): Promise<ScoringResult> {
    if (!this.isInitialized) {
      throw new Error("ML service not initialized");
    }

    const startTime = Date.now();

    try {
      // Preprocess image
      const processedImage = await this.preprocessImage(imageBuffer);

      // Detect faces
      const faceDetection = await this.detectFaces(processedImage);

      if (!faceDetection.detected) {
        return {
          score: 0,
          confidence: 0,
          processingTime: Date.now() - startTime,
          faceDetected: false,
          faceCount: 0,
        };
      }

      // Extract embeddings
      const embeddings = await this.extractEmbeddings(
        processedImage,
        faceDetection
      );

      // Calculate attractiveness score
      const score = await this.calculateAttractiveness(embeddings);

      return {
        score: score.score,
        confidence: score.confidence,
        processingTime: Date.now() - startTime,
        faceDetected: true,
        faceCount: faceDetection.count,
        embeddings,
      };
    } catch (error) {
      logger.error("Error processing image:", error);
      throw error;
    }
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Float32Array> {
    try {
      const { data, info } = await sharp(imageBuffer)
        .resize(224, 224)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Normalize pixel values to [0, 1]
      const float32Data = new Float32Array(224 * 224 * 3);
      for (let i = 0; i < data.length; i++) {
        float32Data[i] = data[i] / 255.0;
      }

      return float32Data;
    } catch (error) {
      logger.error("Error preprocessing image:", error);
      throw new Error("Failed to preprocess image");
    }
  }

  private async detectFaces(
    imageData: Float32Array
  ): Promise<{ detected: boolean; count: number; boxes: number[][] }> {
    if (!this.faceDetectionSession) {
      logger.warn("Face detection model not available");
      return { detected: true, count: 1, boxes: [[0, 0, 224, 224]] };
    }

    try {
      const inputTensor = new ort.Tensor(
        "float32",
        imageData,
        [1, 3, 224, 224]
      );
      const feeds = { [this.faceDetectionSession.inputNames[0]]: inputTensor };

      const results = await this.faceDetectionSession.run(feeds);
      const output = results[this.faceDetectionSession.outputNames[0]];

      // Parse face detection results
      // This is a simplified version - adjust based on your model's output format
      const boxes = this.parseFaceBoxes(output.data as Float32Array);

      return {
        detected: boxes.length > 0,
        count: boxes.length,
        boxes,
      };
    } catch (error) {
      logger.error("Error detecting faces:", error);
      throw new Error("Failed to detect faces");
    }
  }

  private async extractEmbeddings(
    imageData: Float32Array,
    faceDetection: any
  ): Promise<number[]> {
    if (!this.faceEmbeddingSession) {
      logger.warn("Face embedding model not available");
      return new Array(512).fill(0.5);
    }

    try {
      const inputTensor = new ort.Tensor(
        "float32",
        imageData,
        [1, 3, 224, 224]
      );
      const feeds = { [this.faceEmbeddingSession.inputNames[0]]: inputTensor };

      const results = await this.faceEmbeddingSession.run(feeds);
      const embeddings = results[this.faceEmbeddingSession.outputNames[0]];

      return Array.from(embeddings.data as Float32Array);
    } catch (error) {
      logger.error("Error extracting embeddings:", error);
      throw new Error("Failed to extract face embeddings");
    }
  }

  private async calculateAttractiveness(
    embeddings: number[]
  ): Promise<{ score: number; confidence: number }> {
    if (!this.attractivenessSession) {
      logger.warn("Attractiveness model not available");
      return { score: 0.5, confidence: 0.8 };
    }

    try {
      const inputTensor = new ort.Tensor(
        "float32",
        new Float32Array(embeddings),
        [1, embeddings.length]
      );
      const feeds = { [this.attractivenessSession.inputNames[0]]: inputTensor };

      const results = await this.attractivenessSession.run(feeds);
      const output = results[this.attractivenessSession.outputNames[0]];

      const score = output.data[0] as number;
      const confidence = (output.data[1] as number) || 0.9;

      return {
        score: Math.max(0, Math.min(1, score)),
        confidence: Math.max(0, Math.min(1, confidence)),
      };
    } catch (error) {
      logger.error("Error calculating attractiveness:", error);
      throw new Error("Failed to calculate attractiveness score");
    }
  }

  private parseFaceBoxes(data: Float32Array): number[][] {
    // This is a placeholder - implement based on your model's output format
    // Expected format: [x1, y1, x2, y2, confidence, ...]
    const boxes: number[][] = [];

    for (let i = 0; i < data.length; i += 5) {
      const confidence = data[i + 4];
      if (confidence > 0.5) {
        boxes.push([
          data[i], // x1
          data[i + 1], // y1
          data[i + 2], // x2
          data[i + 3], // y2
        ]);
      }
    }

    return boxes;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  get isHealthy(): boolean {
    return this.isInitialized;
  }

  async shutdown(): Promise<void> {
    if (this.faceDetectionSession) {
      await this.faceDetectionSession.release();
    }
    if (this.faceEmbeddingSession) {
      await this.faceEmbeddingSession.release();
    }
    if (this.attractivenessSession) {
      await this.attractivenessSession.release();
    }
    logger.info("ML models released");
  }
}

export const mlService = new MLService();
