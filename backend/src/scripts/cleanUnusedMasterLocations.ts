import { logger } from '../utils/logger';
import { closeRedis } from '../config/redis';
import { cleanRedisPattern } from './cleanRedisCache';
import { query, closeDbPool } from '../queries/dbPool';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';

export interface CleanLocationsResult {
  boothsDeleted: number;
  wardsDeleted: number;
  villagesDeleted: number;
  talukasDeleted: number;
  acsDeleted: number;
  pcsDeleted: number;
  districtsDeleted?: number;
}

/**
 * Checks if a table exists in public schema of the specified database.
 */
async function tableExists(tableName: string, tenantDb?: string): Promise<boolean> {
  const sql = `
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = $1;
  `;
  const res = tenantDb
    ? await TenantPoolManager.query(tenantDb, sql, [tableName])
    : await query(sql, [tableName]);
  return (res.rowCount ?? 0) > 0;
}

/**
 * Cleans unused locations (booths, wards, villages, talukas, ACs, PCs)
 * that have no linked voters or active campaign references.
 *
 * Deletion order (bottom-up leaf to root):
 * 1. booths (not linked to voters, volunteer logs, or user booth assignments)
 * 2. wards (not linked to voters or remaining booths)
 * 3. villages (not linked to voters by ID/name, or remaining booths)
 * 4. talukas (not linked to voters by name, or remaining villages)
 * 5. assembly_constituencies (not linked to voters, remaining booths, or remaining wards)
 * 6. parliamentary_constituencies (not linked to voters, or remaining ACs)
 * 7. (optional) districts (not linked to voters, remaining talukas, or remaining ACs)
 */
export async function cleanUnusedMasterLocations(
  tenantDb?: string,
  dryRun = false,
  includeDistricts = false
): Promise<CleanLocationsResult> {
  const dbLabel = tenantDb ? `Tenant DB (${tenantDb})` : 'Master DB';
  const executeQuery = (sql: string, params: any[] = []) =>
    tenantDb ? TenantPoolManager.query(tenantDb, sql, params) : query(sql, params);

  logger.info(`\n🔍 ${dryRun ? '[DRY RUN] Evaluating' : 'Executing cleanup of'} unused master locations in ${dbLabel}...`);

  const hasVolunteerLogs = await tableExists('volunteer_activity_logs', tenantDb);
  const hasUserBoothAssignments = await tableExists('user_booth_assignments', tenantDb);

  // 1. Unused Booths
  const boothFilterExtra = [
    hasVolunteerLogs ? `AND id NOT IN (SELECT DISTINCT booth_id FROM volunteer_activity_logs WHERE booth_id IS NOT NULL)` : '',
    hasUserBoothAssignments ? `AND id NOT IN (SELECT DISTINCT booth_id FROM user_booth_assignments WHERE booth_id IS NOT NULL)` : '',
  ].filter(Boolean).join(' ');

  const unusedBoothsCondition = `
    WHERE id NOT IN (SELECT DISTINCT booth_id FROM voters WHERE booth_id IS NOT NULL)
    ${boothFilterExtra}
  `;

  // 2. Unused Wards
  const unusedWardsCondition = `
    WHERE id NOT IN (SELECT DISTINCT ward_id FROM voters WHERE ward_id IS NOT NULL)
      AND id NOT IN (
        SELECT DISTINCT ward_id FROM booths 
        WHERE ward_id IS NOT NULL 
          AND id IN (SELECT DISTINCT booth_id FROM voters WHERE booth_id IS NOT NULL)
      )
  `;

  // 3. Unused Villages
  const unusedVillagesCondition = `
    WHERE id NOT IN (SELECT DISTINCT village_id FROM voters WHERE village_id IS NOT NULL)
      AND id NOT IN (
        SELECT DISTINCT village_id FROM booths 
        WHERE village_id IS NOT NULL 
          AND id IN (SELECT DISTINCT booth_id FROM voters WHERE booth_id IS NOT NULL)
      )
      AND name NOT IN (SELECT DISTINCT village FROM voters WHERE village IS NOT NULL AND village != '')
  `;

  // 4. Unused Talukas
  const unusedTalukasCondition = `
    WHERE name NOT IN (SELECT DISTINCT taluka FROM voters WHERE taluka IS NOT NULL AND taluka != '')
      AND id NOT IN (
        SELECT DISTINCT taluka_id FROM villages
        WHERE id IN (SELECT DISTINCT village_id FROM voters WHERE village_id IS NOT NULL)
           OR name IN (SELECT DISTINCT village FROM voters WHERE village IS NOT NULL AND village != '')
      )
  `;

  // 5. Unused ACs
  const unusedAcsCondition = `
    WHERE id NOT IN (SELECT DISTINCT ac_id FROM voters WHERE ac_id IS NOT NULL)
      AND id NOT IN (
        SELECT DISTINCT ac_id FROM booths
        WHERE id IN (SELECT DISTINCT booth_id FROM voters WHERE booth_id IS NOT NULL)
      )
      AND id NOT IN (
        SELECT DISTINCT ac_id FROM wards
        WHERE id IN (SELECT DISTINCT ward_id FROM voters WHERE ward_id IS NOT NULL)
      )
  `;

  // 6. Unused PCs
  const unusedPcsCondition = `
    WHERE id NOT IN (SELECT DISTINCT pc_id FROM voters WHERE pc_id IS NOT NULL)
      AND id NOT IN (
        SELECT DISTINCT pc_id FROM assembly_constituencies
        WHERE id IN (SELECT DISTINCT ac_id FROM voters WHERE ac_id IS NOT NULL)
      )
  `;

  // 7. Unused Districts (optional)
  const unusedDistrictsCondition = `
    WHERE id NOT IN (SELECT DISTINCT district_id FROM voters WHERE district_id IS NOT NULL)
      AND id NOT IN (
        SELECT DISTINCT district_id FROM talukas
        WHERE name IN (SELECT DISTINCT taluka FROM voters WHERE taluka IS NOT NULL AND taluka != '')
      )
      AND id NOT IN (
        SELECT DISTINCT district_id FROM assembly_constituencies
        WHERE id IN (SELECT DISTINCT ac_id FROM voters WHERE ac_id IS NOT NULL)
      )
  `;

  if (dryRun) {
    const bCount = (await executeQuery(`SELECT count(*)::int AS count FROM booths ${unusedBoothsCondition};`)).rows[0].count;
    const wCount = (await executeQuery(`SELECT count(*)::int AS count FROM wards ${unusedWardsCondition};`)).rows[0].count;
    const vCount = (await executeQuery(`SELECT count(*)::int AS count FROM villages ${unusedVillagesCondition};`)).rows[0].count;
    const tCount = (await executeQuery(`SELECT count(*)::int AS count FROM talukas ${unusedTalukasCondition};`)).rows[0].count;
    const acCount = (await executeQuery(`SELECT count(*)::int AS count FROM assembly_constituencies ${unusedAcsCondition};`)).rows[0].count;
    const pcCount = (await executeQuery(`SELECT count(*)::int AS count FROM parliamentary_constituencies ${unusedPcsCondition};`)).rows[0].count;
    let dCount = 0;
    if (includeDistricts) {
      dCount = (await executeQuery(`SELECT count(*)::int AS count FROM districts ${unusedDistrictsCondition};`)).rows[0].count;
    }

    console.log(`\n📊 Dry-Run Statistics for ${dbLabel}:`);
    console.log(`  - Unused Booths to delete:   ${bCount}`);
    console.log(`  - Unused Wards to delete:    ${wCount}`);
    console.log(`  - Unused Villages to delete: ${vCount}`);
    console.log(`  - Unused Talukas to delete:  ${tCount}`);
    console.log(`  - Unused ACs to delete:      ${acCount}`);
    console.log(`  - Unused PCs to delete:      ${pcCount}`);
    if (includeDistricts) {
      console.log(`  - Unused Districts to delete: ${dCount}`);
    }

    return {
      boothsDeleted: bCount,
      wardsDeleted: wCount,
      villagesDeleted: vCount,
      talukasDeleted: tCount,
      acsDeleted: acCount,
      pcsDeleted: pcCount,
      districtsDeleted: dCount,
    };
  }

  // Actual Deletion in bottom-up hierarchical order
  const bRes = await executeQuery(`DELETE FROM booths ${unusedBoothsCondition};`);
  const boothsDeleted = bRes.rowCount ?? 0;
  logger.info(`  ✅ Deleted ${boothsDeleted} unused booths.`);

  const wRes = await executeQuery(`DELETE FROM wards ${unusedWardsCondition};`);
  const wardsDeleted = wRes.rowCount ?? 0;
  logger.info(`  ✅ Deleted ${wardsDeleted} unused wards.`);

  const vRes = await executeQuery(`DELETE FROM villages ${unusedVillagesCondition};`);
  const villagesDeleted = vRes.rowCount ?? 0;
  logger.info(`  ✅ Deleted ${villagesDeleted} unused villages.`);

  const tRes = await executeQuery(`DELETE FROM talukas ${unusedTalukasCondition};`);
  const talukasDeleted = tRes.rowCount ?? 0;
  logger.info(`  ✅ Deleted ${talukasDeleted} unused talukas.`);

  const acRes = await executeQuery(`DELETE FROM assembly_constituencies ${unusedAcsCondition};`);
  const acsDeleted = acRes.rowCount ?? 0;
  logger.info(`  ✅ Deleted ${acsDeleted} unused assembly constituencies (AC).`);

  const pcRes = await executeQuery(`DELETE FROM parliamentary_constituencies ${unusedPcsCondition};`);
  const pcsDeleted = pcRes.rowCount ?? 0;
  logger.info(`  ✅ Deleted ${pcsDeleted} unused parliamentary constituencies (PC).`);

  let districtsDeleted = 0;
  if (includeDistricts) {
    const dRes = await executeQuery(`DELETE FROM districts ${unusedDistrictsCondition};`);
    districtsDeleted = dRes.rowCount ?? 0;
    logger.info(`  ✅ Deleted ${districtsDeleted} unused districts.`);
  }

  return {
    boothsDeleted,
    wardsDeleted,
    villagesDeleted,
    talukasDeleted,
    acsDeleted,
    pcsDeleted,
    districtsDeleted,
  };
}

async function run() {
  const args = process.argv.slice(2);

  let targetTenant: string | null = null;
  let allTenants = false;
  let dryRun = false;
  let includeDistricts = false;

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      dryRun = true;
    } else if (arg === '--all-tenants' || arg === '--all') {
      allTenants = true;
    } else if (arg === '--include-districts' || arg === '--districts') {
      includeDistricts = true;
    } else if (arg.startsWith('--tenant=')) {
      targetTenant = arg.replace('--tenant=', '').trim();
    } else if (!arg.startsWith('-') && !targetTenant) {
      targetTenant = arg.trim();
    }
  }

  try {
    if (dryRun) {
      console.log('🔍 DRY RUN MODE: No database records will be modified.');
    }

    if (targetTenant) {
      await cleanUnusedMasterLocations(targetTenant, dryRun, includeDistricts);
    } else if (allTenants) {
      // Clean Master DB
      await cleanUnusedMasterLocations(undefined, dryRun, includeDistricts);

      // Clean all active tenant databases
      const tenantRes = await query(
        `SELECT tenant_db_name FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL;`
      );
      for (const row of tenantRes.rows) {
        await cleanUnusedMasterLocations(row.tenant_db_name, dryRun, includeDistricts);
      }
    } else {
      // Default: Clean Master DB
      await cleanUnusedMasterLocations(undefined, dryRun, includeDistricts);
    }

    if (!dryRun) {
      console.log('🔄 Invalidating Redis location cache keys (ranniti:masters:*)...');
      const clearedRedisKeys = await cleanRedisPattern('ranniti:masters:*');
      if (clearedRedisKeys.length > 0) {
        console.log(`🧹 Invalidated ${clearedRedisKeys.length} Redis cache keys.`);
      }
    }

    console.log(`\n🎉 Master locations cleanup operation ${dryRun ? 'evaluated' : 'completed'} successfully.\n`);
  } catch (err: any) {
    logger.error('❌ Error during master locations cleanup:', err);
    process.exitCode = 1;
  } finally {
    await closeRedis();
    await TenantPoolManager.closeAll();
    await closeDbPool();
  }
}

if (require.main === module) {
  run();
}
