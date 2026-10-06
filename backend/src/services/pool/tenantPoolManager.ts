import { Pool } from 'pg';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { DataSourceTracker } from '../../utils/dataSourceTracker';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';

interface CachedPool {
  pool: Pool;
  lastUsed: number;
}

export class TenantPoolManager {
  private static pools: Map<string, CachedPool> = new Map();
  private static cleanupIntervalTimer: NodeJS.Timeout | null = null;

  /**
   * Get or create a PostgreSQL connection pool for a specific tenant database.
   */
  static getPool(tenantDbName: string): Pool {
    if (!tenantDbName) {
      throw new Error('[TenantPoolManager] Tenant database name is required');
    }

    const existing = this.pools.get(tenantDbName);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.pool;
    }

    logger.info(`[TenantPoolManager] Initializing connection pool for tenant database '${tenantDbName}'`);

    const pool = getTenantDbPool(tenantDbName);

    // Instrument pool.query and pool.connect for transparent Tenant DB tracking
    const origQuery = pool.query.bind(pool);
    pool.query = (async (...args: any[]) => {
      DataSourceTracker.record(`Tenant DB (${tenantDbName})`);
      return (origQuery as any)(...args);
    }) as any;

    const origConnect = pool.connect.bind(pool);
    pool.connect = (async (...args: any[]) => {
      DataSourceTracker.record(`Tenant DB (${tenantDbName})`);
      return (origConnect as any)(...args);
    }) as any;

    pool.on('error', (err) => {
      logger.error(`[TenantPoolManager] Unexpected error on idle pool for tenant DB '${tenantDbName}':`, err);
    });

    this.pools.set(tenantDbName, {
      pool,
      lastUsed: Date.now(),
    });

    // Start background idle cleanup loop if not already running
    this.ensureCleanupTimer();

    return pool;
  }

  /**
   * Drain pools that have been idle longer than maxIdleMs (default: 10 minutes)
   */
  static async cleanupIdlePools(maxIdleMs = 600000): Promise<void> {
    const now = Date.now();
    for (const [dbName, item] of this.pools.entries()) {
      if (now - item.lastUsed > maxIdleMs) {
        try {
          await item.pool.end();
          this.pools.delete(dbName);
          logger.info(`[TenantPoolManager] Drained idle pool for tenant DB '${dbName}'`);
        } catch (err) {
          logger.error(`[TenantPoolManager] Error draining pool for tenant DB '${dbName}':`, err);
        }
      }
    }
  }

  /**
   * Gracefully close all cached tenant connection pools (used during server shutdown)
   */
  static async closeAll(): Promise<void> {
    if (this.cleanupIntervalTimer) {
      clearInterval(this.cleanupIntervalTimer);
      this.cleanupIntervalTimer = null;
    }

    logger.info(`[TenantPoolManager] Closing all tenant connection pools (${this.pools.size} active)...`);
    const closePromises: Promise<void>[] = [];

    for (const [dbName, item] of this.pools.entries()) {
      closePromises.push(
        item.pool
          .end()
          .then(() => {
            logger.info(`[TenantPoolManager] Closed pool for tenant DB '${dbName}'`);
          })
          .catch((err) => {
            logger.error(`[TenantPoolManager] Error closing pool for tenant DB '${dbName}':`, err);
          })
      );
    }

    await Promise.all(closePromises);
    this.pools.clear();
    logger.info('[TenantPoolManager] All tenant connection pools closed.');
  }

  /**
   * Ensures periodic background check for idle connection pools
   */
  private static ensureCleanupTimer(): void {
    if (!this.cleanupIntervalTimer) {
      this.cleanupIntervalTimer = setInterval(() => {
        this.cleanupIdlePools().catch((err) => {
          logger.error('[TenantPoolManager] Error in background idle pool cleanup:', err);
        });
      }, 300000); // Check every 5 minutes
      this.cleanupIntervalTimer.unref(); // Prevent timer from keeping Node process alive
    }
  }

  /**
   * Returns current active tenant pools count (for metrics/diagnostics)
   */
  static getActivePoolsCount(): number {
    return this.pools.size;
  }
}
