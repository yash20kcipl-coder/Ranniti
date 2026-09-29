import { query, closeDbPool } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

const applyMigration = async () => {
  try {
    logger.info('Applying migration to drop code column from religions table...');
    await query(`
      ALTER TABLE religions DROP COLUMN IF EXISTS code;
    `);
    logger.info('Migration applied successfully.');
  } catch (err: any) {
    logger.error('Migration error:', err.message);
  } finally {
    await closeDbPool();
  }
};

applyMigration();
