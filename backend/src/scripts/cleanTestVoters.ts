import { logger } from '../utils/logger';
import { query, closeDbPool } from '../queries/dbPool';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';

const DEFAULT_PREFIX = 'TEST%';

/**
 * Purges test voters matching a given EPIC prefix.
 * Removes without RETURNING clause for maximum bulk delete speed and minimal memory footprint.
 */
export async function cleanTestVoters(tenantDb?: string, customPrefix?: string): Promise<number> {
  const prefix = customPrefix || DEFAULT_PREFIX;
  const dbLabel = tenantDb ? `Tenant DB (${tenantDb})` : 'Master DB';
  const sql = `DELETE FROM voters WHERE epic_no ILIKE $1;`;
  const values = [prefix];

  logger.info(`🧹 [CleanTestVoters] Purging voters with EPIC like '${prefix}' in ${dbLabel}...`);

  const res = tenantDb
    ? await TenantPoolManager.query(tenantDb, sql, values)
    : await query(sql, values);

  const deletedCount = res.rowCount ?? 0;
  logger.info(`✅ [CleanTestVoters] Successfully deleted ${deletedCount} test voter records in ${dbLabel}.`);
  return deletedCount;
}

async function run() {
  const args = process.argv.slice(2);

  let prefix = DEFAULT_PREFIX;
  let targetTenant: string | null = null;
  let allTenants = false;

  for (const arg of args) {
    if (arg === '--all-tenants' || arg === '--all') {
      allTenants = true;
    } else if (arg.startsWith('--tenant=')) {
      targetTenant = arg.replace('--tenant=', '').trim();
    } else if (arg.startsWith('--prefix=')) {
      prefix = arg.replace('--prefix=', '').trim();
    } else if (!arg.startsWith('-')) {
      if (arg.toUpperCase().startsWith('TEST') || arg.includes('%')) {
        prefix = arg.trim();
      } else {
        targetTenant = arg.trim();
      }
    }
  }

  // Ensure wildcard suffix if plain prefix given without wildcard
  if (!prefix.includes('%') && !prefix.includes('_')) {
    prefix = `${prefix}%`;
  }

  try {
    let totalDeleted = 0;

    if (targetTenant) {
      // Clean specific tenant database
      totalDeleted += await cleanTestVoters(targetTenant, prefix);
    } else if (allTenants) {
      // Clean Master DB
      totalDeleted += await cleanTestVoters(undefined, prefix);

      // Clean all active tenant databases
      const tenantRes = await query(
        `SELECT tenant_db_name FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL;`
      );
      for (const row of tenantRes.rows) {
        totalDeleted += await cleanTestVoters(row.tenant_db_name, prefix);
      }
    } else {
      // Clean Master DB by default
      totalDeleted += await cleanTestVoters(undefined, prefix);
    }

    console.log(`\n🎉 Total test voter records deleted: ${totalDeleted} (Prefix: '${prefix}')\n`);
  } catch (err: any) {
    logger.error('❌ [CleanTestVoters] Execution failed:', err);
    process.exitCode = 1;
  } finally {
    await TenantPoolManager.closeAll();
    await closeDbPool();
  }
}

if (require.main === module) {
  run();
}

