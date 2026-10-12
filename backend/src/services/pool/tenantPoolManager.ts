import { logger } from '../../utils/logger';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DataSourceTracker } from '../../utils/dataSourceTracker';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';

interface CachedPool {
  pool: Pool;
  lastUsed: number;
}

const isTransientConnectionError = (error: any): boolean => {
  if (!error) return false;
  const msg = String(error.message || '');
  const code = String(error.code || '');
  return (
    msg.includes('Connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('timeout expired') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EPIPE') ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === '57P01' ||
    code === '57P02' ||
    code === '57P03' ||
    code === '08006' ||
    code === '08003' ||
    code === '08001'
  );
};

export class TenantPoolManager {
  private static pools: Map<string, CachedPool> = new Map();
  private static cleanupIntervalTimer: NodeJS.Timeout | null = null;
  private static readonly MAX_CACHED_POOLS = 25;
  private static readonly DEFAULT_MAX_IDLE_MS = 120000; // 2 minutes

  /**
   * Get or create a PostgreSQL connection pool for a specific tenant database.
   */
  static getPool(tenantDbName: string): Pool {
    if (!tenantDbName || !tenantDbName.trim()) {
      throw new Error('[TenantPoolManager] Tenant database name is required');
    }

    const trimmed = tenantDbName.trim();
    const existing = this.pools.get(trimmed);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.pool;
    }

    // Enforce LRU pool eviction cap: drain least-recently-used pool if cap reached
    if (this.pools.size >= this.MAX_CACHED_POOLS) {
      this.evictOldestPool();
    }

    logger.info(`[TenantPoolManager] Initializing connection pool for tenant database '${trimmed}' (active pools: ${this.pools.size + 1}/${this.MAX_CACHED_POOLS})`);

    const pool = getTenantDbPool(trimmed);

    pool.on('error', (err) => {
      logger.error(`[TenantPoolManager] Unexpected error on idle pool for tenant DB '${trimmed}':`, err);
    });

    this.pools.set(trimmed, {
      pool,
      lastUsed: Date.now(),
    });

    // Start background idle cleanup loop if not already running
    this.ensureCleanupTimer();

    return pool;
  }

  /**
   * Evicts and drains the least recently used tenant connection pool
   */
  private static evictOldestPool(): void {
    let oldestDbName: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [dbName, item] of this.pools.entries()) {
      if (item.lastUsed < oldestTimestamp) {
        oldestTimestamp = item.lastUsed;
        oldestDbName = dbName;
      }
    }

    if (oldestDbName) {
      const item = this.pools.get(oldestDbName);
      this.pools.delete(oldestDbName);
      if (item) {
        item.pool.end().catch((err) => {
          logger.error(`[TenantPoolManager] Error evicting LRU pool for '${oldestDbName}':`, err);
        });
        logger.info(`[TenantPoolManager] LRU evicted idle pool for '${oldestDbName}' (cap: ${this.MAX_CACHED_POOLS})`);
      }
    }
  }

  /**
   * Executes a query against a tenant database pool with data source tracking, execution duration logging, and transient retry.
   */
  static async query<T extends QueryResultRow = any>(
    tenantDbName: string,
    text: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const pool = this.getPool(tenantDbName);
    const start = process.hrtime.bigint();
    try {
      const res = await pool.query<T>(text, params);
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      if (durationMs > 200) {
        logger.warn(`⚠️ SLOW TENANT DB QUERY [${tenantDbName}] (${durationMs.toFixed(2)}ms): ${text.substring(0, 100)}...`);
      }
      return res;
    } catch (error: any) {
      if (isTransientConnectionError(error)) {
        logger.warn(`[TenantPoolManager] Transient connection drop on query for '${tenantDbName}' (${error.message}). Retrying once...`);
        try {
          const retryRes = await pool.query<T>(text, params);
          return retryRes;
        } catch (retryError: any) {
          logger.error(`[Tenant DB Query Error] [${tenantDbName}] SQL: ${text.substring(0, 150)} | Error: ${retryError.message}`);
          throw retryError;
        }
      }
      logger.error(`[Tenant DB Query Error] [${tenantDbName}] SQL: ${text.substring(0, 150)} | Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Closes a specific tenant pool.
   */
  static async closePool(tenantDbName: string): Promise<void> {
    const trimmed = tenantDbName.trim();
    const item = this.pools.get(trimmed);
    if (item) {
      try {
        await item.pool.end();
        logger.info(`[TenantPoolManager] Closed pool for '${trimmed}'`);
      } catch (err) {
        logger.error(`[TenantPoolManager] Error closing pool for '${trimmed}':`, err);
      } finally {
        this.pools.delete(trimmed);
      }
    }
  }

  /**
   * Alias for closeAll()
   */
  static async closeAllPools(): Promise<void> {
    return this.closeAll();
  }

  /**
   * Drain pools that have been idle longer than maxIdleMs (default: 2 minutes)
   */
  static async cleanupIdlePools(maxIdleMs = this.DEFAULT_MAX_IDLE_MS): Promise<void> {
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
      }, 60000); // Check every 60 seconds
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
