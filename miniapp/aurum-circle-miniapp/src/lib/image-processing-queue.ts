/**
 * Image Processing Queue
 * Queue for handling image preprocessing tasks to prevent CPU blocking
 */

import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { ProcessedFace } from "@/lib/face-embeddings";
import { mlModelIntegration } from "@/lib/ml-models/model-integration";

// Initialize Redis connection
const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

// ML API configuration
const ML_API_URL = process.env.ML_API_URL || "http://localhost:3001";

// ML API response interface
interface MLAPIResponse {
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

// Create the image processing queue
export const imageProcessingQueue = new Queue("imageProcessing", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Function to send image to ML API for processing
async function processImageWithMLAPI(
  imageBase64: string
): Promise<MLAPIResponse> {
  try {
    // Send image to ML API
    const response = await fetch(`${ML_API_URL}/api/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`ML API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const jobId = data.jobId;

    // Poll for result
    const maxRetries = 30; // 30 seconds max wait
    let retries = 0;

    while (retries < maxRetries) {
      const resultResponse = await fetch(`${ML_API_URL}/api/result/${jobId}`);
      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        if (resultData.status === "completed") {
          return resultData.result;
        } else if (resultData.status === "failed") {
          throw new Error(resultData.error || "ML processing failed");
        }
      }

      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
    }

    throw new Error("ML processing timeout");
  } catch (error) {
    console.error("ML API processing failed:", error);
    throw error;
  }
}

// Create the worker that processes image preprocessing jobs
export const imageProcessingWorker = new Worker(
  "imageProcessing",
  async (job: Job) => {
    const { imageBase64, jobId } = job.data;

    try {
      // Process the image with ML API
      const result = await processImageWithMLAPI(imageBase64);

      if (!result) {
        throw new Error("No face detected in image");
      }

      // Convert result to expected format
      const processedResult: ProcessedFace = {
        embedding: Array.from(result.embedding || new Float32Array(512)),
        quality: result.quality || 0.8,
        frontality: result.frontality || 0.8,
        symmetry: result.symmetry || 0.8,
        resolution: result.resolution || 0.8,
      };

      return {
        success: true,
        jobId,
        result: processedResult,
      };
    } catch (error) {
      console.error("Image processing failed:", error);
      throw error;
    }
  },
  { connection: redisConnection }
);

// Event listeners for worker
imageProcessingWorker.on("completed", (job: Job) => {
  console.log(`Job ${job.id} completed successfully`);
});

imageProcessingWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await imageProcessingWorker.close();
  await imageProcessingQueue.close();
  await redisConnection.quit();
});

export default imageProcessingQueue;
