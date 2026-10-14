import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { closeRedis } from '../config/redis';
import { cleanRedisPattern } from './cleanRedisCache';

async function cleanAllVoters() {
  const masterConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  logger.info('========================================================');
  logger.info('🚀 STARTING FULL VOTER DATABASE CLEANUP');
  logger.info(`Master Database: ${masterConfig.database} on ${masterConfig.host}`);
  logger.info('========================================================');

  const masterPool = new Pool(masterConfig);

  try {
    // 1. Inspect existing voters in Master DB
    const masterCountRes = await masterPool.query('SELECT count(*)::int as count FROM voters');
    const masterInitialCount = masterCountRes.rows[0]?.count || 0;
    logger.info(`[Master DB] Found ${masterInitialCount.toLocaleString()} voters before cleanup.`);

    // 2. Fetch all active tenants
    const tenantsRes = await masterPool.query(
      'SELECT id, name, tenant_db_name FROM tenants WHERE tenant_db_name IS NOT NULL'
    );
    const tenants = tenantsRes.rows;
    logger.info(`Found ${tenants.length} tenant database(s) to clean.`);

    // 3. Truncate voters in each Tenant DB
    for (const tenant of tenants) {
      const dbName = tenant.tenant_db_name;
      logger.info(`--------------------------------------------------------`);
      logger.info(`[Tenant DB: ${dbName}] Cleaning voters for "${tenant.name}"...`);

      const tenantPool = new Pool({
        ...masterConfig,
        database: dbName,
      });

      try {
        const countRes = await tenantPool.query('SELECT count(*)::int as count FROM voters');
        const count = countRes.rows[0]?.count || 0;

        await tenantPool.query('TRUNCATE TABLE voters CASCADE');
        logger.info(`[Tenant DB: ${dbName}] ✅ Successfully truncated ${count.toLocaleString()} voters.`);

        // Reset booth total_voters in tenant DB if booths table exists
        const boothCheck = await tenantPool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'booths'
          ) as exists
        `);
        if (boothCheck.rows[0]?.exists) {
          await tenantPool.query('UPDATE booths SET total_voters = 0, updated_at = NOW()');
          logger.info(`[Tenant DB: ${dbName}] ✅ Reset total_voters to 0 on all booths.`);
        }
      } catch (tErr: any) {
        logger.error(`[Tenant DB: ${dbName}] ❌ Failed to clean: ${tErr.message}`);
      } finally {
        await tenantPool.end();
      }
    }

    // 4. Truncate voters in Master DB
    logger.info('--------------------------------------------------------');
    logger.info(`[Master DB: ${masterConfig.database}] Truncating voters table...`);
    await masterPool.query('TRUNCATE TABLE voters CASCADE');
    logger.info(`[Master DB] ✅ Successfully truncated all voters in Master DB.`);

    // Reset booth total_voters in Master DB
    await masterPool.query('UPDATE booths SET total_voters = 0, updated_at = NOW()');
    logger.info(`[Master DB] ✅ Reset total_voters to 0 on all master booths.`);

    // Reset voter count metrics on tenants table
    await masterPool.query(`
      UPDATE tenants 
      SET total_voters_copied = 0,
          processed_records = 0,
          total_records = 0,
          updated_at = NOW()
    `);
    logger.info(`[Master DB] ✅ Reset total_voters metrics in tenants table.`);

    // 5. Invalidate all Redis caches
    logger.info('--------------------------------------------------------');
    logger.info('🧹 Invalidating Redis caches for voters, booths, and stats...');
    const patternsToClean = [
      'ranniti:voters*',
      'ranniti:tenant:stats*',
      'ranniti:masters:booths*',
      'ranniti:masters:*',
      'ranniti:analytics*',
      'ranniti:family*',
    ];

    for (const pat of patternsToClean) {
      try {
        const deleted = await cleanRedisPattern(pat);
        if (deleted.length > 0) {
          logger.info(`[Redis] Cleared ${deleted.length} keys matching "${pat}".`);
        }
      } catch (rErr: any) {
        logger.warn(`[Redis] Error clearing "${pat}": ${rErr.message}`);
      }
    }

    logger.info('========================================================');
    logger.info('🎉 ALL VOTER DATABASES AND CACHES CLEANED SUCCESSFULLY!');
    logger.info('Database is now 100% clean and ready for fresh voter import.');
    logger.info('========================================================');
  } catch (err: any) {
    logger.error('❌ Error during full voter cleanup:', err);
    throw err;
  } finally {
    await masterPool.end();
    await closeRedis();
  }
}

cleanAllVoters().catch((e) => {
  logger.error('Fatal cleanup error:', e);
  process.exit(1);
});
