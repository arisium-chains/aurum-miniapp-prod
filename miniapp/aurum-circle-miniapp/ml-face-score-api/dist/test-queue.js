"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
// Create a test queue and worker
const redis = new ioredis_1.default('redis://localhost:6379');
const testQueue = new bullmq_1.Queue('test', { connection: redis });
// Create a simple worker for testing
const testWorker = new bullmq_1.Worker('test', async (job) => {
    console.log(`Processing job ${job.id} with data:`, job.data);
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { result: 'success', jobId: job.id };
}, { connection: redis });
// Add a test job
async function addTestJob() {
    const job = await testQueue.add('testJob', { test: true });
    console.log(`Added job ${job.id}`);
    // For testing purposes, we'll just wait a bit and then check the job result
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Get the job result
    const updatedJob = await testQueue.getJob(job.id);
    if (updatedJob) {
        const state = await updatedJob.getState();
        console.log(`Job ${job.id} state: ${state}`);
        if (state === 'completed') {
            console.log('Job result:', updatedJob.returnvalue);
        }
    }
    // Clean up
    await testQueue.close();
    await testWorker.close();
    await redis.quit();
}
addTestJob().catch(console.error);
//# sourceMappingURL=test-queue.js.map