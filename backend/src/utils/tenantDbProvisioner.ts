import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from './logger';
import { DataSourceTracker } from './dataSourceTracker';
import { dbPool, query as mainQuery } from '../queries/dbPool';
import { seedSettings } from '../seeds/seeders/setting.seeder';

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

  const pool = new Pool({
    ...baseConfig,
    max: parseInt(process.env.PG_TENANT_POOL_MAX || '15', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    statement_timeout: parseInt(process.env.PG_STATEMENT_TIMEOUT || '300000', 10),
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  } as any);

  pool.on('connect', (client) => {
    client.query('SET idle_in_transaction_session_timeout = 60000;').catch(() => {});
  });

  pool.on('error', (err) => {
    logger.warn(`[TenantPool:${tenantDbName}] Handled unexpected error on idle client: ${err.message}`);
  });

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

  return pool;
};

/**
 * Utility to safely provision a new PostgreSQL tenant database and run base schema migrations.
 */
export class TenantDbProvisioner {
  /**
   * Terminates any existing dangling connections or zombie transactions for the target tenant DB.
   * Prevents deadlocks when provisioning is restarted after an unexpected network drop.
   */
  static async terminateExistingConnections(tenantDbName: string): Promise<void> {
    try {
      const res = await mainQuery(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = $1
           AND pid <> pg_backend_pid()`,
        [tenantDbName.toLowerCase()]
      );
      if (res.rowCount && res.rowCount > 0) {
        logger.info(`[TenantProvisioner] Terminated ${res.rowCount} dangling zombie connection(s) on '${tenantDbName}'.`);
      }
    } catch (err: any) {
      logger.warn(`[TenantProvisioner] Non-fatal error cleaning up connections for '${tenantDbName}': ${err.message}`);
    }
  }

  /**
   * Creates the PostgreSQL database if it does not already exist.
   */
  static async createTenantDatabase(tenantDbName: string): Promise<void> {
    if (!/^ranniti_tenant_[a-z0-9_]+$/i.test(tenantDbName)) {
      throw new Error(`Invalid tenant database name '${tenantDbName}'. Must match /^ranniti_tenant_[a-z0-9_]+$/`);
    }

    // Terminate any previous dangling sessions to prevent relation lock deadlocks
    await this.terminateExistingConnections(tenantDbName);

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
   * Safely drops a dedicated PostgreSQL tenant database after evicting connection pools
   * and terminating all active sessions.
   */
  static async dropTenantDatabase(tenantDbName: string): Promise<boolean> {
    if (!/^ranniti_tenant_[a-z0-9_]+$/i.test(tenantDbName)) {
      throw new Error(`Invalid tenant database name '${tenantDbName}'. Must match /^ranniti_tenant_[a-z0-9_]+$/`);
    }

    // 1. Close pool if active in TenantPoolManager
    const { TenantPoolManager } = await import('../services/pool/tenantPoolManager');
    await TenantPoolManager.closePool(tenantDbName);

    // 2. Terminate any remaining external sessions to this DB
    await this.terminateExistingConnections(tenantDbName);

    // 3. Check if database exists
    const checkRes = await mainQuery(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [tenantDbName.toLowerCase()]
    );

    if (!checkRes.rowCount || checkRes.rowCount === 0) {
      logger.info(`[TenantProvisioner] Database '${tenantDbName}' does not exist.`);
      return false;
    }

    logger.info(`[TenantProvisioner] Dropping database '${tenantDbName}'...`);
    await mainQuery(`DROP DATABASE IF EXISTS ${tenantDbName} WITH (FORCE);`);
    logger.info(`[TenantProvisioner] Successfully dropped database '${tenantDbName}'.`);
    return true;
  }

  /**
   * Runs core schema migrations on the target tenant database using an existing connection pool.
   */
  static async initializeTenantSchemaWithPool(tenantPool: Pool, tenantDbName: string): Promise<void> {
    logger.info(`[TenantProvisioner] Initializing schema for database '${tenantDbName}'...`);

    const migrationFiles = [
      'create_master_tables.sql',
      'create_tenant_users_table.sql',
      'create_voters_table.sql',
      'alter_voter_name_columns_to_text.sql',
      'remove_voter_type_column.sql',
      'create_campaign_settings_tables.sql',
      'remove_push_triggers_column.sql',
      'remove_tenant_whatsapp_config_and_templates.sql',
      'create_tenant_user_roles_table.sql',
      'create_user_synced_contacts_table.sql',
      'create_tenant_sync_outbox_table.sql',
      'create_volunteer_activity_logs_table.sql',
      'create_elections_table.sql',
      'create_voter_election_statuses_table.sql',
      'create_election_booth_turnout_table.sql',
      'drop_slip_columns_from_election_tables.sql',
    ];

    const candidateDirs = [
      path.join(__dirname, '../database/migrations'),
      path.join(__dirname, '../../src/database/migrations'),
      path.join(process.cwd(), 'src/database/migrations'),
      path.join(process.cwd(), 'dist/database/migrations'),
      path.join(process.cwd(), 'backend/src/database/migrations'),
      path.join(process.cwd(), 'backend/dist/database/migrations'),
    ];
    const migrationsDir =
      candidateDirs.find((dir) => fs.existsSync(dir) && fs.existsSync(path.join(dir, 'create_tenant_user_roles_table.sql'))) ||
      candidateDirs[0];

    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationsDir, fileName);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        await tenantPool.query(sql);
        logger.info(`[TenantProvisioner] Executed migration '${fileName}' on '${tenantDbName}'`);
      } else {
        const errMsg = `Migration file '${fileName}' not found at '${filePath}'. Ensure .sql migrations are copied during deployment build.`;
        logger.error(`[TenantProvisioner] ${errMsg}`);
        throw new Error(errMsg);
      }
    }

    // Seed default tenant user roles if empty
    const roleCountRes = await tenantPool.query(`SELECT COUNT(*) as count FROM tenant_user_roles`);
    if (parseInt(roleCountRes.rows[0]?.count || '0', 10) === 0) {
      await tenantPool.query(`
        INSERT INTO tenant_user_roles (role_name, role_key, description, accessible_tabs, voter_permissions, can_create_roles, is_system_default)
        VALUES
          ('PC Leader', 'pc_leader', 'Parliamentary Constituency Campaign Lead', '{"webTabs":[],"masterSubTabs":[],"mobileScreens":["voter_search","family_tree","booth_analytics","gate_meetings"]}'::jsonb, '{"canViewVoter":true,"canEditContact":true,"canEditDemographics":true,"canEditInclination":true,"canEditVoterStatus":true,"canManageFamily":true,"canExportData":true}'::jsonb, '["ac_leader","sub_leader","supporter"]'::jsonb, true),
          ('AC Leader', 'ac_leader', 'Assembly Constituency Coordinator', '{"webTabs":[],"masterSubTabs":[],"mobileScreens":["voter_search","family_tree","booth_analytics","gate_meetings"]}'::jsonb, '{"canViewVoter":true,"canEditContact":true,"canEditDemographics":true,"canEditInclination":true,"canEditVoterStatus":true,"canManageFamily":true,"canExportData":true}'::jsonb, '["sub_leader","supporter"]'::jsonb, true),
          ('Sub-Leader / Ward Coordinator', 'sub_leader', 'Ward & Prabhag Coordinator', '{"webTabs":[],"masterSubTabs":[],"mobileScreens":["voter_search","family_tree","booth_analytics"]}'::jsonb, '{"canViewVoter":true,"canEditContact":true,"canEditDemographics":false,"canEditInclination":true,"canEditVoterStatus":false,"canManageFamily":true,"canExportData":false}'::jsonb, '["supporter"]'::jsonb, true),
          ('Campaign Supporter / Volunteer', 'supporter', 'Booth Level Field Worker', '{"webTabs":[],"masterSubTabs":[],"mobileScreens":["voter_search","family_tree"]}'::jsonb, '{"canViewVoter":true,"canEditContact":true,"canEditDemographics":false,"canEditInclination":true,"canEditVoterStatus":false,"canManageFamily":false,"canExportData":false}'::jsonb, '[]'::jsonb, true)
        ON CONFLICT DO NOTHING;
      `);
      logger.info(`[TenantProvisioner] Seeded default system roles for '${tenantDbName}'`);
    }

    // Ensure tenant_sync_outbox table and origin column exist
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS tenant_sync_outbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(20) NOT NULL,
        payload JSONB NOT NULL,
        origin VARCHAR(20) NOT NULL DEFAULT 'tenant',
        status VARCHAR(20) DEFAULT 'pending',
        retry_count INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE tenant_sync_outbox ADD COLUMN IF NOT EXISTS origin VARCHAR(20) NOT NULL DEFAULT 'tenant';
      CREATE INDEX IF NOT EXISTS idx_tenant_sync_outbox_status ON tenant_sync_outbox (status);
    `).catch(() => {});

    // Seed campaign settings & WhatsApp templates for the newly provisioned tenant DB
    await seedSettings(tenantDbName);

    logger.info(`[TenantProvisioner] Finished initializing schema for '${tenantDbName}'.`);
  }

  /**
   * Runs core schema migrations on the target tenant database (manages its own pool).
   */
  static async initializeTenantSchema(tenantDbName: string): Promise<void> {
    const tenantPool = getTenantDbPool(tenantDbName);
    try {
      await this.initializeTenantSchemaWithPool(tenantPool, tenantDbName);
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
    const tableCheck = await mainQuery(
      `SELECT to_regclass('public.tenants') IS NOT NULL AS exists`
    );
    if (!tableCheck.rows?.[0]?.exists) {
      logger.info('[TenantProvisioner] `tenants` table does not exist yet. Skipping tenant migration pass.');
      return;
    }

    const tenants = await mainQuery(
      `SELECT tenant_db_name AS db_name FROM tenants WHERE tenant_db_name IS NOT NULL`
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

