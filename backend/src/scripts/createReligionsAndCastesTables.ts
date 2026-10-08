import fs from 'fs';
import path from 'path';
import { query, closeDbPool } from '../queries/dbPool';
import { TenantDbProvisioner } from '../utils/tenantDbProvisioner';
import { logger } from '../utils/logger';

async function run() {
  logger.info('🚀 Executing Religions & Castes Table Migration Script...');

  try {
    const migrationPath = path.join(__dirname, '../database/migrations/create_master_tables.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration SQL file not found at ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Execute on Main Database
    logger.info('Executing migration on Main Database...');
    await query(sql);
    logger.info('✅ Successfully executed religions and castes migration on Main Database.');

    // 2. Execute on all active Tenant Databases
    logger.info('Executing migration on all Tenant Databases...');
    await TenantDbProvisioner.runMigrationsOnAllTenants();
    logger.info('✅ Successfully executed religions and castes migration on all Tenant Databases.');

    logger.info('🎉 Table creation process complete!');
  } catch (err: any) {
    logger.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await closeDbPool();
  }
}

run();
