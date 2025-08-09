"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const hybrid_scorer_1 = require("../services/hybrid-scorer");
// Redis connection
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null,
});
// Create worker
const faceScoringWorker = new bullmq_1.Worker("faceScoring", async (job) => {
    const { imageBase64 } = job.data;
    console.log(`Processing job ${job.id}`);
    try {
        // Process the image with hybrid scorer (real ML with fallback)
        const result = await hybrid_scorer_1.hybridScorer.processImage(imageBase64);
        // Check if result has the expected properties for real ML
        if ("embedding" in result && "quality" in result) {
            // This is the real ML result, convert to expected format for existing system
            const processedResult = {
                embedding: result.embedding,
                quality: result.quality,
                frontality: result.frontality,
                symmetry: result.symmetry,
                resolution: result.resolution,
                confidence: result.confidence,
            };
            console.log(`Job ${job.id} completed successfully with real ML`);
            return processedResult;
        }
        else {
            // This is the simulated result, convert it to the expected format
            console.log(`Job ${job.id} completed with simulated ML`);
            return result;
        }
    }
    catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
    }
}, { connection: redis });
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
exports.default = faceScoringWorker;
//# sourceMappingURL=faceScoring.worker.js.map