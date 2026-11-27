import { query as masterQuery, closeDbPool, dbPool } from '../queries/dbPool';
import { getTenantDbPool } from '../utils/tenantDbProvisioner';
import { logger } from '../utils/logger';

async function sanitizeMasterTables(queryFn: (sql: string, params?: any[]) => Promise<any>, dbLabel: string) {
  logger.info(`[Sanitize:${dbLabel}] Sanitizing master lookup tables...`);

  const tables = [
    { table: 'states', col: 'name' },
    { table: 'districts', col: 'name' },
    { table: 'talukas', col: 'name' },
    { table: 'villages', col: 'name' },
    { table: 'parliamentary_constituencies', col: 'name' },
    { table: 'assembly_constituencies', col: 'name' },
    { table: 'wards', col: 'name' },
    { table: 'booths', col: 'name' },
    { table: 'religions', col: 'name' },
    { table: 'castes', col: 'name' },
    { table: 'profession_categories', col: 'name' },
    { table: 'professions', col: 'name' },
  ];

  for (const { table, col } of tables) {
    try {
      const res = await queryFn(
        `UPDATE ${table} SET ${col} = INITCAP(${col}) WHERE ${col} = UPPER(${col}) AND length(${col}) > 3`
      );
      if (res.rowCount && res.rowCount > 0) {
        logger.info(`[Sanitize:${dbLabel}] Updated ${res.rowCount} rows in ${table}.${col}`);
      }
    } catch (err: any) {
      // Table might not exist in tenant DB
      logger.debug(`[Sanitize:${dbLabel}] Skipped ${table}: ${err.message}`);
    }
  }

  // Location building in booths
  try {
    const res = await queryFn(
      `UPDATE booths SET location_building = INITCAP(location_building) WHERE location_building = UPPER(location_building) AND length(location_building) > 3`
    );
    if (res.rowCount && res.rowCount > 0) {
      logger.info(`[Sanitize:${dbLabel}] Updated ${res.rowCount} rows in booths.location_building`);
    }
  } catch {}

  // Caste category standardization
  try {
    await queryFn(`UPDATE castes SET category = 'OBC' WHERE category ILIKE 'obc'`);
    await queryFn(`UPDATE castes SET category = 'SC' WHERE category ILIKE 'sc'`);
    await queryFn(`UPDATE castes SET category = 'ST' WHERE category ILIKE 'st'`);
    await queryFn(`UPDATE castes SET category = INITCAP(category) WHERE category NOT IN ('OBC', 'SC', 'ST') AND category = UPPER(category) AND length(category) > 3`);
  } catch {}
}

async function sanitizeVoters(queryFn: (sql: string, params?: any[]) => Promise<any>, dbLabel: string) {
  logger.info(`[Sanitize:${dbLabel}] Counting all-caps voters...`);

  const countRes = await queryFn(`
    SELECT count(*)::int as total
    FROM voters
    WHERE (eng_first_name IS NOT NULL AND eng_first_name != INITCAP(eng_first_name))
       OR (eng_surname IS NOT NULL AND eng_surname != INITCAP(eng_surname))
       OR (guardian_name IS NOT NULL AND guardian_name != INITCAP(guardian_name))
  `);

  const totalToUpdate = countRes.rows[0]?.total || 0;
  logger.info(`[Sanitize:${dbLabel}] Found ${totalToUpdate.toLocaleString()} voter records requiring casing sanitization.`);

  if (totalToUpdate === 0) {
    logger.info(`[Sanitize:${dbLabel}] All voter records already have clean title casing.`);
    return;
  }

  const BATCH_SIZE = 10000;
  let updatedSoFar = 0;
  let batchIndex = 1;

  while (true) {
    const updateRes = await queryFn(`
      WITH candidates AS (
        SELECT id
        FROM voters
        WHERE (eng_first_name IS NOT NULL AND eng_first_name != INITCAP(eng_first_name))
           OR (eng_surname IS NOT NULL AND eng_surname != INITCAP(eng_surname))
           OR (guardian_name IS NOT NULL AND guardian_name != INITCAP(guardian_name))
        LIMIT ${BATCH_SIZE}
      )
      UPDATE voters v
      SET eng_first_name = CASE
            WHEN v.eng_first_name IS NOT NULL AND v.eng_first_name != INITCAP(v.eng_first_name) THEN INITCAP(v.eng_first_name)
            ELSE v.eng_first_name
          END,
          eng_middle_name = CASE
            WHEN v.eng_middle_name IS NOT NULL AND v.eng_middle_name != INITCAP(v.eng_middle_name) THEN INITCAP(v.eng_middle_name)
            ELSE v.eng_middle_name
          END,
          eng_surname = CASE
            WHEN v.eng_surname IS NOT NULL AND v.eng_surname != INITCAP(v.eng_surname) THEN INITCAP(v.eng_surname)
            ELSE v.eng_surname
          END,
          guardian_name = CASE
            WHEN v.guardian_name IS NOT NULL AND v.guardian_name != INITCAP(v.guardian_name) THEN INITCAP(v.guardian_name)
            ELSE v.guardian_name
          END
      FROM candidates c
      WHERE v.id = c.id
    `);

    const batchCount = updateRes.rowCount || 0;
    updatedSoFar += batchCount;

    logger.info(`[Sanitize:${dbLabel}] Batch ${batchIndex}: sanitized ${batchCount.toLocaleString()} voters (Total so far: ${updatedSoFar.toLocaleString()} / ~${totalToUpdate.toLocaleString()})`);

    if (batchCount === 0) {
      break;
    }

    batchIndex++;
  }

  logger.info(`[Sanitize:${dbLabel}] Voter sanitization complete! Total records updated: ${updatedSoFar.toLocaleString()}`);
}

async function run() {
  const startTime = Date.now();
  logger.info('===============================================================');
  logger.info('🚀 STARTING DATABASE TEXT CASING SANITIZATION');
  logger.info('===============================================================');

  try {
    // 1. Sanitize Master DB
    await sanitizeMasterTables(masterQuery, 'MASTER_DB');
    await sanitizeVoters(masterQuery, 'MASTER_DB');

    // 2. Sanitize Tenant DBs
    const tenantsRes = await masterQuery(
      `SELECT id, name, tenant_db_name FROM tenants WHERE status = 'active'`
    );

    for (const tenant of tenantsRes.rows) {
      const tenantDbName = tenant.tenant_db_name;
      if (!tenantDbName) continue;

      logger.info(`---------------------------------------------------------------`);
      logger.info(`Processing Tenant DB: ${tenant.name} (${tenantDbName})`);
      logger.info(`---------------------------------------------------------------`);

      const tenantPool = getTenantDbPool(tenantDbName);
      try {
        await sanitizeMasterTables((sql, params) => tenantPool.query(sql, params), `TENANT:${tenantDbName}`);
        await sanitizeVoters((sql, params) => tenantPool.query(sql, params), `TENANT:${tenantDbName}`);
      } catch (err: any) {
        logger.error(`[Sanitize:TENANT:${tenantDbName}] Error: ${err.message}`);
      } finally {
        await tenantPool.end();
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info('===============================================================');
    logger.info(`✅ TEXT CASING SANITIZATION COMPLETED SUCCESSFULLY IN ${duration}s`);
    logger.info('===============================================================');
  } catch (err: any) {
    logger.error(`Fatal error during sanitization: ${err.message}`, err);
  } finally {
    await closeDbPool();
  }
}

run();
