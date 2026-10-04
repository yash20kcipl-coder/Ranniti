import { config } from '../config';
import { logger } from '../utils/logger';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DataSourceTracker } from '../utils/dataSourceTracker';

export const dbPool = new Pool(
  config.dbHost && config.dbName
    ? {
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
        max: parseInt(process.env.PG_POOL_MAX || '25', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      }
    : {
        connectionString: config.databaseUrl || 'postgres://postgres:postgres@localhost:5432/ranniti_db',
        max: parseInt(process.env.PG_POOL_MAX || '25', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      }
);

// Instrument pool.query and pool.connect for transparent Master DB tracking
const origPoolQuery = dbPool.query.bind(dbPool);
dbPool.query = (async (...args: any[]) => {
  DataSourceTracker.record('Master DB');
  return (origPoolQuery as any)(...args);
}) as any;

const origPoolConnect = dbPool.connect.bind(dbPool);
dbPool.connect = (async (...args: any[]) => {
  DataSourceTracker.record('Master DB');
  return (origPoolConnect as any)(...args);
}) as any;

dbPool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client pool', err);
});

/**
 * Execute parameterized SQL query with execution duration tracking
 */
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> => {
  DataSourceTracker.record('Master DB');
  const start = process.hrtime.bigint();
  try {
    const res = await dbPool.query<T>(text, params);
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (durationMs > 200) {
      logger.warn(`⚠️ SLOW DB QUERY (${durationMs.toFixed(2)}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (error: any) {
    logger.error(`[DB Query Error] SQL: ${text.substring(0, 150)} | Error: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully close the PostgreSQL connection pool (prevents open connections/zombies)
 */
export const closeDbPool = async (): Promise<void> => {
  try {
    const { TenantPoolManager } = await import('../utils/tenantPoolManager');
    await TenantPoolManager.closeAllPools();
  } catch (err) {
    logger.error('Error closing tenant database pools:', err);
  }

  try {
    logger.info('Closing PostgreSQL database connection pool...');
    await dbPool.end();
    logger.info('PostgreSQL connection pool closed.');
  } catch (err) {
    logger.error('Error closing PostgreSQL connection pool:', err);
  }
};
