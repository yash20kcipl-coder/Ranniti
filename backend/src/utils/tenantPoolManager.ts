import { Pool, QueryResult, QueryResultRow } from 'pg';
import { getTenantDbPool } from './tenantDbProvisioner';
import { logger } from './logger';
import { DataSourceTracker } from './dataSourceTracker';

/**
 * TenantPoolManager:
 * Manages reusable, idle-aware connection pools for tenant PostgreSQL databases.
 * Guarantees connection reuse, transparent data source tracking, and zero open connections on shutdown.
 */
export class TenantPoolManager {
  private static pools: Map<string, Pool> = new Map();

  /**
   * Retrieves an existing pool or creates a new one for the given tenant database.
   */
  static getPool(tenantDbName: string): Pool {
    const trimmed = tenantDbName.trim();
    let pool = this.pools.get(trimmed);
    if (!pool) {
      pool = getTenantDbPool(trimmed);
      this.pools.set(trimmed, pool);
      logger.info(`[TenantPoolManager] Initialized connection pool for '${trimmed}'`);
    }
    return pool;
  }

  /**
   * Executes a query against a tenant database pool with data source tracking and execution duration logging.
   */
  static async query<T extends QueryResultRow = any>(
    tenantDbName: string,
    text: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const pool = this.getPool(tenantDbName);
    DataSourceTracker.record(`Tenant DB (${tenantDbName})`);
    const start = process.hrtime.bigint();
    try {
      const res = await pool.query<T>(text, params);
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      if (durationMs > 200) {
        logger.warn(`⚠️ SLOW TENANT DB QUERY [${tenantDbName}] (${durationMs.toFixed(2)}ms): ${text.substring(0, 100)}...`);
      }
      return res;
    } catch (error: any) {
      logger.error(`[Tenant DB Query Error] [${tenantDbName}] SQL: ${text.substring(0, 150)} | Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Closes a specific tenant pool.
   */
  static async closePool(tenantDbName: string): Promise<void> {
    const trimmed = tenantDbName.trim();
    const pool = this.pools.get(trimmed);
    if (pool) {
      try {
        await pool.end();
        logger.info(`[TenantPoolManager] Closed pool for '${trimmed}'`);
      } catch (err) {
        logger.error(`[TenantPoolManager] Error closing pool for '${trimmed}':`, err);
      } finally {
        this.pools.delete(trimmed);
      }
    }
  }

  /**
   * Gracefully closes all active tenant database pools.
   */
  static async closeAllPools(): Promise<void> {
    logger.info(`[TenantPoolManager] Closing ${this.pools.size} active tenant database pool(s)...`);
    const closePromises = Array.from(this.pools.entries()).map(async ([name, pool]) => {
      try {
        await pool.end();
      } catch (err) {
        logger.error(`[TenantPoolManager] Error closing pool for '${name}':`, err);
      }
    });
    await Promise.all(closePromises);
    this.pools.clear();
    logger.info('[TenantPoolManager] All tenant database pools closed.');
  }
}
