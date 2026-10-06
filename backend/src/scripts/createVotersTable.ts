import fs from 'fs';
import path from 'path';
import { query, closeDbPool } from '../queries/dbPool';
import { TenantDbProvisioner } from '../utils/tenantDbProvisioner';
import { logger } from '../utils/logger';

async function run() {
  logger.info('🚀 Executing Voters Table Migration Script...');

  try {
    const migrationPath = path.join(__dirname, '../database/migrations/create_voters_table.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration SQL file not found at ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. Execute on Main Master Database
    logger.info('Executing voters migration on Main Database...');
    await query(sql);
    logger.info('✅ Successfully created voters table and indexes on Main Database.');

    // 2. Execute on all active Tenant Databases
    logger.info('Executing voters migration on all Tenant Databases...');
    await TenantDbProvisioner.runMigrationsOnAllTenants();
    logger.info('✅ Successfully executed voters migration on all Tenant Databases.');

    logger.info('🎉 Voters table creation process complete!');
  } catch (err: any) {
    logger.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await closeDbPool();
  }
}

run();
