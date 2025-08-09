"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
// Redis connection
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null,
});
// Create queue
const faceScoringQueue = new bullmq_1.Queue("faceScoring", { connection: redis });
async function addTestJob() {
    try {
        // Read a test image file and convert to base64
        // In a real test, you would use an actual image file
        const testImageBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBAQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
        // Add job to queue
        const job = await faceScoringQueue.add("processImage", {
            imageBase64: testImageBase64,
        });
        console.log(`Job ${job.id} added to queue`);
        // For now, we won't wait for the result as the events property doesn't exist
        // In a real implementation, you would handle this properly
        console.log("Job added successfully. Check the worker logs for completion.");
        // Close connections after a delay
        setTimeout(async () => {
            await faceScoringQueue.close();
            await redis.quit();
        }, 1000);
    }
    catch (error) {
        console.error("Error:", error);
        // Close connections
        await faceScoringQueue.close();
        await redis.quit();
    }
}
addTestJob();
//# sourceMappingURL=test-queue.js.map