import { logger } from '../utils/logger';
import { CacheService } from './cache.service';
import { SyncManifestService } from './syncManifest.service';

export type MasterCategory =
  | 'states'
  | 'districts'
  | 'pcs'
  | 'acs'
  | 'talukas'
  | 'villages'
  | 'wards'
  | 'booths'
  | 'religions'
  | 'castes'
  | 'parties'
  | 'voters'
  | 'tenantSettings'
  | 'userRoles';

interface CategoryConfig {
  masterPattern?: string;
  tenantPattern?: (tenant: string) => string;
  syncKey?: string;
  additionalPatterns?: (tenant: string) => string[];
}

const CATEGORY_REGISTRY: Record<MasterCategory, CategoryConfig> = {
  states: {
    masterPattern: 'ranniti:masters:states*',
    tenantPattern: (t) => `ranniti:tenant:${t}:states*`,
    syncKey: 'states',
  },
  districts: {
    masterPattern: 'ranniti:masters:districts*',
    tenantPattern: (t) => `ranniti:tenant:${t}:districts*`,
    syncKey: 'districts',
  },
  pcs: {
    masterPattern: 'ranniti:masters:pcs*',
    tenantPattern: (t) => `ranniti:tenant:${t}:pcs*`,
    syncKey: 'pcs',
  },
  acs: {
    masterPattern: 'ranniti:masters:acs*',
    tenantPattern: (t) => `ranniti:tenant:${t}:acs*`,
    syncKey: 'acs',
  },
  talukas: {
    masterPattern: 'ranniti:masters:talukas*',
    tenantPattern: (t) => `ranniti:tenant:${t}:talukas*`,
    syncKey: 'talukas',
  },
  villages: {
    masterPattern: 'ranniti:masters:villages*',
    tenantPattern: (t) => `ranniti:tenant:${t}:villages*`,
    syncKey: 'villages',
  },
  wards: {
    masterPattern: 'ranniti:masters:wards*',
    tenantPattern: (t) => `ranniti:tenant:${t}:wards*`,
    syncKey: 'wards',
  },
  booths: {
    masterPattern: 'ranniti:masters:booths*',
    tenantPattern: (t) => `ranniti:tenant:${t}:booth*`,
    syncKey: 'booths',
    additionalPatterns: (t) => [`ranniti:tenant:${t}:booth_options*`],
  },
  religions: {
    masterPattern: 'ranniti:masters:religions*',
    tenantPattern: (t) => `ranniti:tenant:${t}:religions*`,
    syncKey: 'religions',
  },
  castes: {
    masterPattern: 'ranniti:masters:castes*',
    tenantPattern: (t) => `ranniti:tenant:${t}:castes*`,
    syncKey: 'castes',
  },
  parties: {
    masterPattern: 'ranniti:masters:parties*',
    tenantPattern: (t) => `ranniti:tenant:${t}:parties*`,
    syncKey: 'parties',
  },
  voters: {
    tenantPattern: (t) => `ranniti:tenant:${t}:voter*`,
    syncKey: 'voters',
    additionalPatterns: (t) => [`ranniti:tenant:${t}:stats*`],
  },
  tenantSettings: {
    tenantPattern: (t) => `ranniti:tenant:${t}:settings*`,
    syncKey: 'tenantSettings',
  },
  userRoles: {
    tenantPattern: (t) => `ranniti:tenant:${t}:roles*`,
    syncKey: 'userRoles',
  },
};

export class MasterCacheInvalidator {
  /**
   * Unified invalidator: purges Master Redis caches, Tenant Redis caches,
   * and increments Sync Manifest versions concurrently.
   *
   * @param categories Single category or array of categories
   * @param tenantDbName Optional tenant database name or tenantId
   */
  static async invalidate(
    categories: MasterCategory | MasterCategory[],
    tenantDbName?: string | null
  ): Promise<void> {
    const list = Array.isArray(categories) ? categories : [categories];
    if (list.length === 0) return;

    const tenantKey = tenantDbName?.trim() || '*';
    const tasks: Promise<any>[] = [];

    for (const cat of list) {
      const config = CATEGORY_REGISTRY[cat];
      if (!config) continue;

      // 1. Invalidate Master DB Redis pattern
      if (config.masterPattern) {
        tasks.push(CacheService.invalidatePattern(config.masterPattern));
      }

      // 2. Invalidate Tenant DB Redis pattern
      if (config.tenantPattern) {
        tasks.push(CacheService.invalidatePattern(config.tenantPattern(tenantKey)));
        if (tenantDbName?.trim()) {
          tasks.push(CacheService.invalidatePattern(config.tenantPattern('master')));
        }
      }

      // 3. Additional patterns (e.g. stats, booth_options)
      if (config.additionalPatterns) {
        for (const pattern of config.additionalPatterns(tenantKey)) {
          tasks.push(CacheService.invalidatePattern(pattern));
        }
        if (tenantDbName?.trim()) {
          for (const pattern of config.additionalPatterns('master')) {
            tasks.push(CacheService.invalidatePattern(pattern));
          }
        }
      }

      // 4. Bump Sync Manifest version
      if (config.syncKey) {
        tasks.push(SyncManifestService.bumpVersion(config.syncKey, tenantDbName || undefined));
      }
    }

    try {
      await Promise.allSettled(tasks);
      logger.info(
        `[MasterCacheInvalidator] Invalidation and sync bump completed for [${list.join(', ')}] (tenant: ${tenantDbName || 'global'})`
      );
    } catch (err: any) {
      logger.error(`[MasterCacheInvalidator] Error during invalidation for [${list.join(', ')}]:`, err);
    }
  }
}
