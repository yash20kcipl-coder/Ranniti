import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export class SyncManifestService {
  private static getKey(tenantId?: string): string {
    return tenantId ? `sync:manifest:tenant:${tenantId}` : `sync:manifest:global`;
  }

  /**
   * Fetch all registered dataset versions for a tenant in O(1) from Redis.
   */
  static async getManifestVersions(tenantId?: string): Promise<Record<string, number>> {
    if (!redisClient || redisClient.status !== 'ready') return {};
    try {
      const raw = await redisClient.hgetall(this.getKey(tenantId));
      const versions: Record<string, number> = {};
      for (const [field, val] of Object.entries(raw)) {
        versions[field] = parseInt(val, 10) || 1;
      }
      return versions;
    } catch (error) {
      logger.error('Failed to read sync manifest from Redis', { error });
      return {};
    }
  }

  /**
   * Increment version counter when a dataset is modified.
   */
  static async bumpVersion(apiKey: string, tenantId?: string): Promise<number> {
    if (!redisClient || redisClient.status !== 'ready') return 1;
    try {
      const newVersion = await redisClient.hincrby(this.getKey(tenantId), apiKey, 1);
      return newVersion;
    } catch (error) {
      logger.error(`Failed to bump sync version for key ${apiKey}`, { error });
      return 1;
    }
  }

  /**
   * Reset or clear manifest keys (e.g. during database seeding or clean reset).
   */
  static async resetManifest(tenantId?: string): Promise<void> {
    if (!redisClient || redisClient.status !== 'ready') return;
    try {
      await redisClient.del(this.getKey(tenantId));
    } catch (error) {
      logger.error(`Failed to reset sync manifest for tenant ${tenantId || 'global'}`, { error });
    }
  }
}
