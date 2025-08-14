/**
 * @description Centralized queue management for face scoring jobs
 * Extracted to avoid circular dependencies between index.ts and API routes
 * With graceful degradation when Redis is unavailable
 */

import Bull from 'bull';
import { createRedisClient } from '../utils/redis';
import { logger } from '@shared/utils';

// Configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';

// Module state
let redisClient: ReturnType<typeof createRedisClient> | null = null;
let faceScoringQueue: Bull.Queue | null = null;
let isInitialized = false;
let isRedisAvailable = false;

/**
 * @description Initialize queue with graceful degradation
 */
export async function initializeQueue(): Promise<void> {
  if (isInitialized) return;

  try {
    logger.info(`Attempting to connect to Redis at: ${redisUrl}`);

    // Create Redis client
    redisClient = createRedisClient();

    // Attempt to connect Redis client with timeout
    if (!redisClient.isReady) {
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        ),
      ]);
    }

    // Create Bull queue
    faceScoringQueue = new Bull('faceScoring', redisUrl);

    // Test queue connection
    await faceScoringQueue.isReady();

    isRedisAvailable = true;
    logger.info('✅ Queue and Redis client initialized successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(
      '⚠️  Redis/Queue initialization failed, running in degraded mode:',
      errorMessage
    );
    logger.info('📝 ML API will function without queue/caching capabilities');

    // Clean up failed connections
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch {}
      redisClient = null;
    }

    if (faceScoringQueue) {
      try {
        await faceScoringQueue.close();
      } catch {}
      faceScoringQueue = null;
    }

    isRedisAvailable = false;
  } finally {
    isInitialized = true;
  }
}

/**
 * @description Get face scoring queue (null if Redis unavailable)
 */
export function getFaceScoringQueue(): Bull.Queue | null {
  return faceScoringQueue;
}

/**
 * @description Get Redis client (null if Redis unavailable)
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * @description Check if Redis/Queue is available
 */
export function isQueueAvailable(): boolean {
  return isRedisAvailable && faceScoringQueue !== null;
}

/**
 * @description Check if Redis client is available
 */
export function isRedisClientAvailable(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * @description Cleanup function for graceful shutdown
 */
export async function closeQueue(): Promise<void> {
  try {
    if (faceScoringQueue) {
      await faceScoringQueue.close();
    }
    if (redisClient) {
      await redisClient.quit();
    }
    logger.info('Queue and Redis client closed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error closing queue:', errorMessage);
  }
}

// Export the queue for backward compatibility (can be null)
export { faceScoringQueue, redisClient };
