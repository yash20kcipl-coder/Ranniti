import { logger } from '../utils/logger';
import { query, closeDbPool } from '../queries/dbPool';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';

const DEFAULT_PREFIX = 'TEST%';

/**
 * Purges all test voters created with a TEST% prefix (or specified custom prefix).
 * Usage:
 *   npx tsx src/scripts/cleanTestVoters.ts [prefix] [tenantDbName]
 */
export async function cleanTestVoters(tenantDb?: string, customPrefix?: string): Promise<number> {
  const prefix = customPrefix || DEFAULT_PREFIX;
  const sql = `DELETE FROM voters WHERE epic_no LIKE $1 RETURNING id;`;
  const values = [prefix];

  logger.info(`[CleanTestVoters] Purging voters with EPIC like '${prefix}' ${tenantDb ? `in tenant '${tenantDb}'` : 'in master pool'}...`);

  const res = tenantDb
    ? await TenantPoolManager.query(tenantDb, sql, values)
    : await query(sql, values);

  const deletedCount = res.rowCount ?? 0;
  logger.info(`[CleanTestVoters] Successfully deleted ${deletedCount} test voter records.`);
  return deletedCount;
}

if (require.main === module) {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  // If arg1 starts with 'TEST' or contains '%', treat as prefix, else treat as tenantDb
  const prefixArg = arg1 && (arg1.toUpperCase().startsWith('TEST') || arg1.includes('%')) ? arg1 : undefined;
  const tenantDbArg = prefixArg ? arg2 : arg1;

  cleanTestVoters(tenantDbArg, prefixArg)
    .then((deleted) => {
      console.log(`Deleted ${deleted} test records with prefix ${prefixArg || DEFAULT_PREFIX}`);
      return closeDbPool();
    })
    .then(() => process.exit(0))
    .catch(async (err) => {
      console.error('[CleanTestVoters] Error:', err);
      await closeDbPool();
      process.exit(1);
    });
}
