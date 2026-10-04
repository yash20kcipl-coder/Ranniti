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
        // Retry connection up to 3 times with exponential backoff, then temporarily stop
        if (times > 3) {
          logger.warn(`[RedisConfig] Exceeded max retries (${times}). Redis cache degraded.`);
          return null;
        }
        return Math.min(times * 100, 1000);
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
