import { config } from '../config';
import { logger } from '../utils/logger';
import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * Cache map storing active PostgreSQL pool instances for isolated tenant databases.
 */
const tenantPoolMap = new Map<string, Pool>();

/**
 * Get or create a PostgreSQL connection pool for a specific Tenant Database.
 */
export const getTenantDbPool = (tenantDbName: string): Pool => {
  if (tenantPoolMap.has(tenantDbName)) {
    return tenantPoolMap.get(tenantDbName)!;
  }

  logger.info(`🔌 Initializing new PostgreSQL Connection Pool for Tenant Database: ${tenantDbName}`);

  const pool = new Pool({
    host: config.dbHost || 'localhost',
    port: config.dbPort || 5432,
    user: config.dbUser || 'postgres',
    password: config.dbPassword || 'postgres',
    database: tenantDbName,
    max: parseInt(process.env.PG_TENANT_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });

  pool.on('error', (err) => {
    logger.error(`[Tenant DB Error: ${tenantDbName}] Unexpected error on idle pool client:`, err);
  });

  tenantPoolMap.set(tenantDbName, pool);
  return pool;
};

/**
 * Execute parameterized query against a specific tenant database with duration tracking.
 */
export const queryTenantDb = async <T extends QueryResultRow = any>(
  tenantDbName: string,
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> => {
  const pool = getTenantDbPool(tenantDbName);
  const start = process.hrtime.bigint();
  try {
    const res = await pool.query<T>(text, params);
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (durationMs > 200) {
      logger.warn(`⚠️ SLOW TENANT QUERY [${tenantDbName}] (${durationMs.toFixed(2)}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (error: any) {
    logger.error(`[Tenant DB Query Error: ${tenantDbName}] SQL: ${text.substring(0, 150)} | Error: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully close all open tenant database connection pools.
 */
export const closeAllTenantDbPools = async (): Promise<void> => {
  logger.info(`Closing ${tenantPoolMap.size} tenant PostgreSQL database connection pools...`);
  const closePromises: Promise<void>[] = [];
  
  for (const [dbName, pool] of tenantPoolMap.entries()) {
    closePromises.push(
      pool.end().then(() => {
        logger.info(`Closed connection pool for Tenant DB: ${dbName}`);
      }).catch((err) => {
        logger.error(`Error closing pool for Tenant DB ${dbName}:`, err);
      })
    );
  }

  await Promise.all(closePromises);
  tenantPoolMap.clear();
};
