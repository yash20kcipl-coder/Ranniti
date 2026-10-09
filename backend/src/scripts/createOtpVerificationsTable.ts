import fs from 'fs';
import path from 'path';
import { query, closeDbPool } from '../queries/dbPool';
import { logger } from '../utils/logger';

async function run() {
  logger.info('🚀 Executing OTP Verifications Table Migration Script...');

  try {
    const migrationPath = path.join(__dirname, '../database/migrations/create_otp_verifications_table.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration SQL file not found at ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    logger.info('Executing otp_verifications migration on Main Database...');
    await query(sql);
    logger.info('✅ Successfully created otp_verifications table and indexes on Main Database.');
  } catch (err: any) {
    logger.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await closeDbPool();
  }
}

run();
