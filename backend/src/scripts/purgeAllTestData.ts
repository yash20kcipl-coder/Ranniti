import { query, closeDbPool } from '../queries/dbPool';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';
import { CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

export async function purgeAllTestData(): Promise<{
  master: {
    voters: number;
    booths: number;
    wards: number;
    acs: number;
    pcs: number;
    districts: number;
    castes: number;
  };
  tenants: Record<string, any>;
}> {
  console.log('🧹 [PurgeAllTestData] Starting deletion of test data...');

  const results: any = {
    master: { voters: 0, booths: 0, wards: 0, acs: 0, pcs: 0, districts: 0, castes: 0 },
    tenants: {},
  };

  // ── Step 1: Clean all tenant databases ──────────────────────────────
  const tenantsRes = await query(`SELECT id, name, tenant_db_name, ac_ids, pc_ids FROM tenants`);
  
  for (const tenant of tenantsRes.rows) {
    const dbName = tenant.tenant_db_name;
    if (!dbName) continue;

    console.log(`\n🔍 Checking tenant database '${dbName}' (${tenant.name})...`);
    results.tenants[dbName] = { voters: 0, booths: 0, wards: 0, acs: 0, pcs: 0, districts: 0, castes: 0 };

    try {
      // 1. Delete test voters
      const vRes = await TenantPoolManager.query(
        dbName,
        `DELETE FROM voters WHERE epic_no ILIKE 'TEST%'`
      );
      results.tenants[dbName].voters = vRes.rowCount || 0;
      console.log(`  - Deleted ${vRes.rowCount || 0} test voters from '${dbName}'`);

      // 2. Delete test booths
      const bRes = await TenantPoolManager.query(
        dbName,
        `DELETE FROM booths WHERE name ILIKE '%TEST%'`
      );
      results.tenants[dbName].booths = bRes.rowCount || 0;
      console.log(`  - Deleted ${bRes.rowCount || 0} test booths from '${dbName}'`);

      // 3. Delete test wards
      const wRes = await TenantPoolManager.query(
        dbName,
        `DELETE FROM wards WHERE name ILIKE '%TEST%'`
      );
      results.tenants[dbName].wards = wRes.rowCount || 0;
      console.log(`  - Deleted ${wRes.rowCount || 0} test wards from '${dbName}'`);

      // 4. Delete test assembly constituencies
      const acRes = await TenantPoolManager.query(
        dbName,
        `DELETE FROM assembly_constituencies WHERE name ILIKE '%TEST%'`
      );
      results.tenants[dbName].acs = acRes.rowCount || 0;
      console.log(`  - Deleted ${acRes.rowCount || 0} test ACs from '${dbName}'`);

      // 5. Delete test parliamentary constituencies
      const pcRes = await TenantPoolManager.query(
        dbName,
        `DELETE FROM parliamentary_constituencies WHERE name ILIKE '%TEST%'`
      );
      results.tenants[dbName].pcs = pcRes.rowCount || 0;
      console.log(`  - Deleted ${pcRes.rowCount || 0} test PCs from '${dbName}'`);

      // 6. Delete test districts
      const dRes = await TenantPoolManager.query(
        dbName,
        `DELETE FROM districts WHERE name ILIKE '%TEST%'`
      );
      results.tenants[dbName].districts = dRes.rowCount || 0;
      console.log(`  - Deleted ${dRes.rowCount || 0} test districts from '${dbName}'`);

      // 7. Delete test castes
      const cRes = await TenantPoolManager.query(
        dbName,
        `DELETE FROM castes WHERE name ILIKE '%TEST%'`
      );
      results.tenants[dbName].castes = cRes.rowCount || 0;
      console.log(`  - Deleted ${cRes.rowCount || 0} test castes from '${dbName}'`);
    } catch (err: any) {
      console.warn(`  ⚠️ Could not process tenant '${dbName}': ${err.message}`);
    }
  }

  // ── Step 2: Clean Master DB ─────────────────────────────────────────
  console.log(`\n🔍 Cleaning Master DB ('ranniti_db')...`);

  // 1. Delete test voters
  const masterVoters = await query(`DELETE FROM voters WHERE epic_no ILIKE 'TEST%'`);
  results.master.voters = masterVoters.rowCount || 0;
  console.log(`  - Deleted ${results.master.voters} test voters from Master DB`);

  // 2. Delete test booths
  const masterBooths = await query(`DELETE FROM booths WHERE name ILIKE '%TEST%'`);
  results.master.booths = masterBooths.rowCount || 0;
  console.log(`  - Deleted ${results.master.booths} test booths from Master DB`);

  // 3. Delete test wards
  const masterWards = await query(`DELETE FROM wards WHERE name ILIKE '%TEST%'`);
  results.master.wards = masterWards.rowCount || 0;
  console.log(`  - Deleted ${results.master.wards} test wards from Master DB`);

  // Identify Test AC and PC IDs before deletion
  const testAcsRes = await query(`SELECT id FROM assembly_constituencies WHERE name ILIKE '%TEST%'`);
  const testAcIds = testAcsRes.rows.map((r: any) => r.id);

  const testPcsRes = await query(`SELECT id FROM parliamentary_constituencies WHERE name ILIKE '%TEST%'`);
  const testPcIds = testPcsRes.rows.map((r: any) => r.id);

  // 4. Detach Test ACs and PCs from tenants table
  if (testAcIds.length > 0 || testPcIds.length > 0) {
    for (const acId of testAcIds) {
      await query(
        `UPDATE tenants 
         SET ac_ids = array_remove(ac_ids, $1::uuid),
             total_voters_copied = CASE 
               WHEN ac_ids = ARRAY[$1::uuid] THEN 0 
               ELSE total_voters_copied 
             END,
             status = CASE 
               WHEN ac_ids = ARRAY[$1::uuid] THEN 'pending' 
               ELSE status 
             END
         WHERE $1::uuid = ANY(ac_ids)`,
        [acId]
      );
    }
    for (const pcId of testPcIds) {
      await query(
        `UPDATE tenants SET pc_ids = array_remove(pc_ids, $1::uuid) WHERE $1::uuid = ANY(pc_ids)`,
        [pcId]
      );
    }
    console.log(`  - Cleaned test AC/PC references from tenants table`);
  }

  // 5. Delete test assembly constituencies
  const masterAcs = await query(`DELETE FROM assembly_constituencies WHERE name ILIKE '%TEST%'`);
  results.master.acs = masterAcs.rowCount || 0;
  console.log(`  - Deleted ${results.master.acs} test ACs from Master DB`);

  // 6. Delete test parliamentary constituencies
  const masterPcs = await query(`DELETE FROM parliamentary_constituencies WHERE name ILIKE '%TEST%'`);
  results.master.pcs = masterPcs.rowCount || 0;
  console.log(`  - Deleted ${results.master.pcs} test PCs from Master DB`);

  // 7. Delete test districts
  const masterDistricts = await query(`DELETE FROM districts WHERE name ILIKE '%TEST%'`);
  results.master.districts = masterDistricts.rowCount || 0;
  console.log(`  - Deleted ${results.master.districts} test districts from Master DB`);

  // 8. Delete test castes
  const masterCastes = await query(`DELETE FROM castes WHERE name ILIKE '%TEST%'`);
  results.master.castes = masterCastes.rowCount || 0;
  console.log(`  - Deleted ${results.master.castes} test castes from Master DB`);

  // ── Step 3: Clear Redis Caches ──────────────────────────────────────
  console.log(`\n🧹 Invalidate Redis caches...`);
  try {
    await CacheService.invalidatePattern('ranniti:masters:*');
    await CacheService.invalidatePattern('ranniti:voters:*');
    await CacheService.invalidatePattern('ranniti:tenants:*');
    console.log(`  - Successfully invalidated Redis master caches.`);
  } catch (cacheErr: any) {
    console.warn(`  ⚠️ Non-fatal Redis cache purge error: ${cacheErr.message}`);
  }

  console.log(`\n🎉 Test Data Purge Complete!`);
  return results;
}

if (require.main === module) {
  purgeAllTestData()
    .then((res) => {
      console.log('\nFinal Results:', JSON.stringify(res, null, 2));
      return TenantPoolManager.closeAll().then(() => closeDbPool());
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Purge failed:', err);
      process.exit(1);
    });
}
