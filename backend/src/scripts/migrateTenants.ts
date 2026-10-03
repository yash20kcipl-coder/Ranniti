import { TenantDbProvisioner } from '../utils/tenantDbProvisioner';
import { closeDbPool } from '../queries/dbPool';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';
import { logger } from '../utils/logger';

async function main() {
  logger.info('🚀 Starting tenant database migration runner...');
  try {
    await TenantDbProvisioner.runMigrationsOnAllTenants();
    logger.info('✅ Tenant database migrations completed successfully.');
  } catch (err) {
    logger.error('❌ Migration runner failed:', err);
    process.exitCode = 1;
  } finally {
    await TenantPoolManager.closeAll();
    await closeDbPool();
  }
}

main();
