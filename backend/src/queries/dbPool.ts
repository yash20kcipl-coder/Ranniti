import { config } from '../config';
import { logger } from '../utils/logger';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DataSourceTracker } from '../utils/dataSourceTracker';

const poolSettings = {
  max: parseInt(process.env.PG_POOL_MAX || '25', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  statement_timeout: 60000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const dbPool = new Pool(
  config.dbHost && config.dbName
    ? {
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
        ...poolSettings,
      }
    : {
        connectionString: config.databaseUrl || 'postgres://postgres:postgres@localhost:5432/ranniti_db',
        ...poolSettings,
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
 * Checks if an error is a transient connection drop suitable for a single auto-retry
 */
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
    code === '57P01' || // admin_shutdown
    code === '57P02' || // crash_shutdown
    code === '57P03' || // cannot_connect_now
    code === '08006' || // connection_failure
    code === '08003' || // connection_does_not_exist
    code === '08001'    // sqlclient_unable_to_establish_sqlconnection
  );
};

/**
 * Execute parameterized SQL query with execution duration tracking and transient retry
 */
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> => {
  DataSourceTracker.record('Master DB');
  const slowThreshold = parseInt(process.env.DB_SLOW_QUERY_THRESHOLD_MS || '800', 10);
  const start = process.hrtime.bigint();
  try {
    const res = await dbPool.query<T>(text, params);
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (durationMs > slowThreshold) {
      logger.warn(`⚠️ SLOW DB QUERY (${durationMs.toFixed(2)}ms): ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (error: any) {
    if (isTransientConnectionError(error)) {
      logger.warn(`[dbPool] Transient connection drop on query (${error.message}). Retrying once...`);
      try {
        const retryRes = await dbPool.query<T>(text, params);
        return retryRes;
      } catch (retryError: any) {
        logger.error(`[DB Query Error] SQL: ${text.substring(0, 150)} | Error: ${retryError.message}`);
        throw retryError;
      }
    }
    logger.error(`[DB Query Error] SQL: ${text.substring(0, 150)} | Error: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully close the PostgreSQL connection pool (prevents open connections/zombies)
 */
export const closeDbPool = async (): Promise<void> => {
  try {
    const { TenantPoolManager } = await import('../services/pool/tenantPoolManager');
    await TenantPoolManager.closeAll();
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
