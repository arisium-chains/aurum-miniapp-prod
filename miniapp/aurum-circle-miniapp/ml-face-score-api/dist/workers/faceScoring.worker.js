"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const scorer_1 = require("../services/scorer");
// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new ioredis_1.default(redisUrl);
// Create worker
const faceScoringWorker = new bullmq_1.Worker('faceScoring', async (job) => {
    const { image, isBase64 } = job.data;
    console.log(`Processing job ${job.id}`);
    try {
        // Process the image
        const result = await (0, scorer_1.processImage)(image);
        console.log(`Job ${job.id} completed with score: ${result.score}`);
        return result;
    }
    catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
    }
}, { connection: redis });
// Handle worker events
faceScoringWorker.on('completed', job => {
    if (job) {
        console.log(`Job ${job.id} has completed!`);
    }
});
faceScoringWorker.on('failed', (job, err) => {
    if (job) {
        console.error(`Job ${job.id} has failed with ${err.message}`);
    }
});
console.log('Face scoring worker started');
exports.default = faceScoringWorker;
//# sourceMappingURL=faceScoring.worker.js.map