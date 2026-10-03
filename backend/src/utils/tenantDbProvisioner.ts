import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from './logger';
import { dbPool, query as mainQuery } from '../queries/dbPool';

/**
 * Creates a dedicated connection pool for a specific tenant database.
 * Remember to call `await pool.end()` in a `finally` block to prevent open connections!
 */
export const getTenantDbPool = (tenantDbName: string): Pool => {
  const baseConfig = config.dbHost && config.dbName
    ? {
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: tenantDbName,
      }
    : {
        connectionString: (config.databaseUrl || 'postgres://postgres:postgres@localhost:5432/ranniti_db').replace(
          /\/[^/]+$/,
          `/${tenantDbName}`
        ),
      };

  return new Pool({
    ...baseConfig,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
};

/**
 * Utility to safely provision a new PostgreSQL tenant database and run base schema migrations.
 */
export class TenantDbProvisioner {
  /**
   * Creates the PostgreSQL database if it does not already exist.
   */
  static async createTenantDatabase(tenantDbName: string): Promise<void> {
    if (!/^ranniti_tenant_[a-z0-9_]+$/i.test(tenantDbName)) {
      throw new Error(`Invalid tenant database name '${tenantDbName}'. Must match /^ranniti_tenant_[a-z0-9_]+$/`);
    }

    // Check if database exists
    const checkRes = await mainQuery(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [tenantDbName.toLowerCase()]
    );

    if (checkRes.rowCount && checkRes.rowCount > 0) {
      logger.info(`[TenantProvisioner] Database '${tenantDbName}' already exists.`);
      return;
    }

    logger.info(`[TenantProvisioner] Creating dedicated database '${tenantDbName}'...`);
    // PostgreSQL CREATE DATABASE cannot use parameters ($1)
    await mainQuery(`CREATE DATABASE ${tenantDbName}`);
    logger.info(`[TenantProvisioner] Successfully created database '${tenantDbName}'.`);
  }

  /**
   * Runs core schema migrations on the target tenant database.
   */
  static async initializeTenantSchema(tenantDbName: string): Promise<void> {
    const tenantPool = getTenantDbPool(tenantDbName);

    try {
      logger.info(`[TenantProvisioner] Initializing schema for database '${tenantDbName}'...`);

      const migrationFiles = [
        'create_master_tables.sql',
        'create_voters_table.sql',
      ];

      const migrationsDir = path.join(__dirname, '../database/migrations');

      for (const fileName of migrationFiles) {
        const filePath = path.join(migrationsDir, fileName);
        if (fs.existsSync(filePath)) {
          const sql = fs.readFileSync(filePath, 'utf8');
          await tenantPool.query(sql);
          logger.info(`[TenantProvisioner] Executed migration '${fileName}' on '${tenantDbName}'`);
        }
      }

      // Ensure tenant_sync_outbox table exists
      const outboxTableSql = `
        CREATE TABLE IF NOT EXISTS tenant_sync_outbox (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          action VARCHAR(20) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          retry_count INT DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await tenantPool.query(outboxTableSql);

      logger.info(`[TenantProvisioner] Finished initializing schema for '${tenantDbName}'.`);
    } catch (err: any) {
      logger.error(`[TenantProvisioner] Failed to initialize schema on '${tenantDbName}':`, err);
      throw err;
    } finally {
      await tenantPool.end();
    }
  }

  /**
   * Applies schema migrations to all active tenant databases
   */
  static async runMigrationsOnAllTenants(): Promise<void> {
    const tenants = await mainQuery(
      `SELECT tenant_db_name AS db_name FROM tenant_assignments WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
    );

    if (!tenants.rows || tenants.rows.length === 0) {
      logger.info('[TenantProvisioner] No active tenants found for schema migration.');
      return;
    }
    for (const tenant of tenants.rows) {
      logger.info(`[TenantProvisioner] Running pending migrations on '${tenant.db_name}'...`);
      await this.initializeTenantSchema(tenant.db_name);
    }
    logger.info('[TenantProvisioner] Schema migrations complete for all active tenants.');
  }
}

