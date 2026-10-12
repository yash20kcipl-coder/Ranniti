import './index';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

const isEnabled = process.env.REDIS_ENABLED === 'true';

export const redisClient: Redis | null = isEnabled
  ? new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    retryStrategy(times) {
      // Exponential backoff up to 5 seconds so Redis automatically reconnects if restarted,
      // without blocking requests (since enableOfflineQueue is false and maxRetriesPerRequest is 3)
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  })
  : null;

let hasLoggedWarning = false;

if (redisClient) {
  redisClient.on('connect', () => {
    hasLoggedWarning = false;
    logger.info('✅ Connected to Redis cache server.');
  });

  redisClient.on('error', (err: any) => {
    if (!hasLoggedWarning && err.code === 'ECONNREFUSED') {
      hasLoggedWarning = true;
      logger.warn(`⚠️ Redis server not detected at ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379} — Falling back to PostgreSQL directly.`);
    } else if (err.code !== 'ECONNREFUSED') {
      logger.warn(`⚠️ Redis Notice: ${err.message}`);
    }
  });
}

/**
 * Gracefully disconnects Redis client connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      if (redisClient.status === 'ready' || redisClient.status === 'connect') {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      } else {
        redisClient.disconnect();
      }
    } catch {
      redisClient.disconnect();
    }
  }
};
