import { query, closeDbPool } from '../queries/dbPool';
import { TenantPoolManager } from '../utils/tenantPoolManager';
import { logger } from '../utils/logger';

/**
 * Validates that a table name contains only safe alphanumeric characters and underscores.
 */
function isValidTableName(table: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table);
}

/**
 * Checks if a table exists in public schema.
 */
async function tableExists(tableName: string, tenantDb?: string): Promise<boolean> {
  const sql = `
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = $1
  `;
  const res = tenantDb
    ? await TenantPoolManager.query(tenantDb, sql, [tableName])
    : await query(sql, [tableName]);
  return (res.rowCount ?? 0) > 0;
}

/**
 * Gets row count of a table.
 */
async function getRowCount(tableName: string, tenantDb?: string): Promise<number> {
  const sql = `SELECT COUNT(*)::bigint AS count FROM "${tableName}"`;
  const res = tenantDb
    ? await TenantPoolManager.query(tenantDb, sql)
    : await query(sql);
  return parseInt(res.rows[0]?.count || '0', 10);
}

/**
 * Lists all user tables in public schema.
 */
async function listTables(tenantDb?: string): Promise<string[]> {
  const sql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  const res = tenantDb
    ? await TenantPoolManager.query(tenantDb, sql)
    : await query(sql);
  return res.rows.map((r: any) => r.table_name);
}

/**
 * Truncates / cleans a single table in a specific DB.
 */
async function cleanSingleTable(tableName: string, dbLabel: string, tenantDb?: string) {
  const exists = await tableExists(tableName, tenantDb);
  if (!exists) {
    logger.warn(`⚠️ Table "${tableName}" does not exist in ${dbLabel}. Skipping.`);
    return;
  }

  const countBefore = await getRowCount(tableName, tenantDb);
  logger.info(`🧹 Cleaning "${tableName}" in ${dbLabel} (current rows: ${countBefore})...`);

  const sql = `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`;
  if (tenantDb) {
    await TenantPoolManager.query(tenantDb, sql);
  } else {
    await query(sql);
  }

  const countAfter = await getRowCount(tableName, tenantDb);
  logger.info(`✅ Cleaned "${tableName}" in ${dbLabel} (remaining rows: ${countAfter}).`);
}

async function run() {
  const args = process.argv.slice(2);

  // Parse arguments
  let tableName = '';
  let targetTenant: string | null = null;
  let allTenants = false;
  let showList = false;

  for (const arg of args) {
    if (arg === '--list' || arg === '-l') {
      showList = true;
    } else if (arg.startsWith('--table=')) {
      tableName = arg.replace('--table=', '').trim();
    } else if (arg.startsWith('--tenant=')) {
      targetTenant = arg.replace('--tenant=', '').trim();
    } else if (arg === '--all-tenants' || arg === '--all') {
      allTenants = true;
    } else if (!arg.startsWith('-') && !tableName) {
      tableName = arg.trim();
    }
  }

  try {
    if (showList || (!tableName && !showList)) {
      logger.info('📋 Available tables in Master DB:');
      const tables = await listTables();
      console.log(tables.map((t) => `  - ${t}`).join('\n'));
      console.log('\nUsage Examples:');
      console.log('  npm run clean:table voters');
      console.log('  npm run clean:table -- --table=voters');
      console.log('  npm run clean:table -- --table=voters --all-tenants');
      console.log('  npm run clean:table -- --table=voters --tenant=ranniti_tenant_<id>');
      console.log('  npm run clean:table -- --list\n');
      return;
    }

    if (!isValidTableName(tableName)) {
      logger.error(`❌ Invalid table name "${tableName}". Only alphanumeric characters and underscores allowed.`);
      process.exitCode = 1;
      return;
    }

    if (targetTenant) {
      // Clean table in specific tenant DB
      await cleanSingleTable(tableName, `Tenant DB (${targetTenant})`, targetTenant);
    } else if (allTenants) {
      // 1. Clean in Master DB
      await cleanSingleTable(tableName, 'Master DB');

      // 2. Fetch all active tenant databases
      const tenantRes = await query(
        `SELECT tenant_db_name FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
      );
      for (const row of tenantRes.rows) {
        await cleanSingleTable(tableName, `Tenant DB (${row.tenant_db_name})`, row.tenant_db_name);
      }
    } else {
      // Default: Clean table in Master DB
      await cleanSingleTable(tableName, 'Master DB');
    }

    logger.info(`🎉 Table cleaning operation completed for "${tableName}".`);
  } catch (err: any) {
    logger.error('❌ Error during table clean operation:', err);
    process.exitCode = 1;
  } finally {
    await closeDbPool();
  }
}

run();
