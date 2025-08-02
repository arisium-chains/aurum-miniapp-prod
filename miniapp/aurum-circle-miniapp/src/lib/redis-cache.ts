/**
 * Redis Cache Service
 * Provides caching functionality for facial scores and leaderboard data
 */

import Redis from "ioredis";

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 24 * 60 * 60;

export class RedisCache {
  /**
   * Cache a user's facial score
   */
  static async cacheFacialScore(userId: string, score: number): Promise<void> {
    try {
      await redis.setex(`facial_score:${userId}`, CACHE_TTL, score.toString());
    } catch (error) {
      console.error("Error caching facial score:", error);
    }
  }

  /**
   * Get a user's cached facial score
   */
  static async getFacialScore(userId: string): Promise<number | null> {
    try {
      const score = await redis.get(`facial_score:${userId}`);
      return score ? parseFloat(score) : null;
    } catch (error) {
      console.error("Error getting cached facial score:", error);
      return null;
    }
  }

  /**
   * Cache leaderboard data
   */
  static async cacheLeaderboard(
    key: string,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      await redis.setex(`leaderboard:${key}`, CACHE_TTL, JSON.stringify(data));
    } catch (error) {
      console.error("Error caching leaderboard:", error);
    }
  }

  /**
   * Get cached leaderboard data
   */
  static async getLeaderboard(
    key: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const data = await redis.get(`leaderboard:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting cached leaderboard:", error);
      return null;
    }
  }

  /**
   * Invalidate a cached facial score
   */
  static async invalidateFacialScore(userId: string): Promise<void> {
    try {
      await redis.del(`facial_score:${userId}`);
    } catch (error) {
      console.error("Error invalidating facial score cache:", error);
    }
  }

  /**
   * Invalidate leaderboard cache
   */
  static async invalidateLeaderboard(key: string): Promise<void> {
    try {
      await redis.del(`leaderboard:${key}`);
    } catch (error) {
      console.error("Error invalidating leaderboard cache:", error);
    }
  }

  /**
   * Close Redis connection
   */
  static async close(): Promise<void> {
    await redis.quit();
  }
}
