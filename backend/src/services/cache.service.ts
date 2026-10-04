import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import { DataSourceTracker } from '../utils/dataSourceTracker';

export class CacheService {
  /**
   * Helper: Calculate randomized TTL with Jitter (±15%) to prevent Thundering Herd / Cache Stampede
   */
  private static getJitteredTtl(baseTtlSeconds: number): number {
    const jitterPct = Number(process.env.REDIS_TTL_JITTER_PCT) || 15;
    const factor = 1 + (Math.random() * 2 - 1) * (jitterPct / 100);
    return Math.floor(baseTtlSeconds * factor);
  }

  /**
   * Helper: Acquire a Cache Lease (Lock) to prevent duplicate DB queries during cache miss
   */
  private static async acquireLease(
    lockKey: string,
    leaseSeconds: number = 5
  ): Promise<{ acquired: boolean; leaseId: string; release: () => Promise<void> }> {
    const leaseId = `${process.pid}_${Math.random().toString(36).substring(2, 9)}`;
    if (!redisClient || redisClient.status !== 'ready') {
      return { acquired: false, leaseId, release: async () => { } };
    }

    try {
      const result = await redisClient.set(lockKey, leaseId, 'EX', leaseSeconds, 'NX');
      const acquired = result === 'OK';

      if (!acquired) {
        return { acquired: false, leaseId, release: async () => { } };
      }

      // Heartbeat: Auto-renew lease every (leaseSeconds / 2) seconds if computation is running
      const heartbeatInterval = setInterval(async () => {
        try {
          if (redisClient && redisClient.status === 'ready') {
            const currentOwner = await redisClient.get(lockKey);
            if (currentOwner === leaseId) {
              await redisClient.expire(lockKey, leaseSeconds);
            } else {
              clearInterval(heartbeatInterval);
            }
          }
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, (leaseSeconds * 1000) / 2);

      const release = async () => {
        clearInterval(heartbeatInterval);
        try {
          if (redisClient && redisClient.status === 'ready') {
            const currentOwner = await redisClient.get(lockKey);
            if (currentOwner === leaseId) {
              await redisClient.del(lockKey);
            }
          }
        } catch { }
      };

      return { acquired: true, leaseId, release };
    } catch {
      return { acquired: false, leaseId, release: async () => { } };
    }
  }

  /**
   * High-Level Get-Or-Set Cache Pattern with Lease Protection, Jitter & Fallback
   */
  static async getOrSet<T>(
    key: string,
    baseTtlSeconds: number,
    fetchFn: () => Promise<T>,
    leaseSeconds: number = 5
  ): Promise<T> {
    // 1. Attempt Cache Read
    if (redisClient && redisClient.status === 'ready') {
      try {
        const cached = await redisClient.get(key);
        if (cached) {
          DataSourceTracker.record('Redis');
          return JSON.parse(cached) as T;
        }
      } catch (err: any) {
        logger.warn(`[CacheService] Read error for key '${key}': ${err.message}`);
      }
    }

    // 2. Attempt Cache Lease (Lock) to prevent Thundering Herd
    const lockKey = `ranniti:lease:${key}`;
    const { acquired, release } = await this.acquireLease(lockKey, leaseSeconds);

    if (!acquired && redisClient && redisClient.status === 'ready') {
      // Lease held by another worker -> Wait ~60ms and retry reading cached value
      await new Promise((resolve) => setTimeout(resolve, 60));
      try {
        const retryCached = await redisClient.get(key);
        if (retryCached) {
          DataSourceTracker.record('Redis');
          return JSON.parse(retryCached) as T;
        }
      } catch { }
    }

    try {
      // 3. Fetch fresh data from PostgreSQL
      const data = await fetchFn();

      // 4. Cache fresh data in Redis with Jittered TTL
      if (redisClient && redisClient.status === 'ready' && data !== null && data !== undefined) {
        try {
          const finalTtl = this.getJitteredTtl(baseTtlSeconds);
          await redisClient.setex(key, finalTtl, JSON.stringify(data));
        } catch (err: any) {
          logger.warn(`[CacheService] Write error for key '${key}': ${err.message}`);
        }
      }

      return data;
    } finally {
      await release(); // Always release lock
    }
  }

  /**
   * Delete specific key(s)
   */
  static async del(...keys: string[]): Promise<void> {
    if (!redisClient || redisClient.status !== 'ready' || keys.length === 0) return;
    try {
      await redisClient.del(...keys);
    } catch (err: any) {
      logger.warn(`[CacheService] Delete error for keys: ${err.message}`);
    }
  }

  /**
   * Delete specific key or wildcard pattern (e.g. 'ranniti:masters:acs*')
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    if (!redisClient || redisClient.status !== 'ready') return;

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`[CacheService] Invalidated ${keys.length} keys matching '${pattern}'`);
      }
    } catch (err: any) {
      logger.warn(`[CacheService] Invalidation error for pattern '${pattern}': ${err.message}`);
    }
  }
}
