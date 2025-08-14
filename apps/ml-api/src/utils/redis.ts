import { createClient, RedisClientType } from 'redis';
import { logger } from '@shared/utils';

export function createRedisClient(): RedisClientType {
  // [DEPRECATED: 2025-08-11] Docker hostname preserved for reference
  // url: process.env.REDIS_URL || "redis://redis:6380",

  // Use localhost for local development, redis hostname for Docker
  const client: RedisClientType = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380',
  });

  client.on('error', (err: Error) => {
    logger.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    logger.info('Connected to Redis');
  });

  return client;
}
