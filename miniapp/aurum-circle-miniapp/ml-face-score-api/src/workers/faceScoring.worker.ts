import { Worker } from "bullmq";
import Redis from "ioredis";
import { hybridScorer } from "../services/hybrid-scorer";
import { ProcessedFaceResult, SimulatedMLResult } from "../types";

// Redis connection
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Create worker
const faceScoringWorker = new Worker(
  "faceScoring",
  async (job) => {
    const { imageBase64 } = job.data;

    console.log(`Processing job ${job.id}`);

    try {
      // Process the image with hybrid scorer (real ML with fallback)
      const result = await hybridScorer.processImage(imageBase64);

      // Check if result has the expected properties for real ML
      if ("embedding" in result && "quality" in result) {
        // This is the real ML result, convert to expected format for existing system
        const processedResult = {
          embedding: (result as ProcessedFaceResult).embedding,
          quality: (result as ProcessedFaceResult).quality,
          frontality: (result as ProcessedFaceResult).frontality,
          symmetry: (result as ProcessedFaceResult).symmetry,
          resolution: (result as ProcessedFaceResult).resolution,
          confidence: (result as ProcessedFaceResult).confidence,
        };

        console.log(`Job ${job.id} completed successfully with real ML`);
        return processedResult;
      } else {
        // This is the simulated result, convert it to the expected format
        console.log(`Job ${job.id} completed with simulated ML`);
        return result;
      }
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// Handle worker events
faceScoringWorker.on("completed", (job) => {
  if (job) {
    console.log(`Job ${job.id} has completed!`);
  }
});

faceScoringWorker.on("failed", (job, err) => {
  if (job) {
    console.error(`Job ${job.id} has failed with ${err.message}`);
  }
});

console.log("Face scoring worker started with Rust ML integration");

export default faceScoringWorker;
