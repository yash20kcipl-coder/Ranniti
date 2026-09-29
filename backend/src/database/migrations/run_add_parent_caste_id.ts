import { query, closeDbPool } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

const applyMigration = async () => {
  try {
    logger.info('Applying migration to add parent_caste_id to castes table...');
    await query(`
      ALTER TABLE castes 
      ADD COLUMN IF NOT EXISTS parent_caste_id UUID REFERENCES castes(id) ON DELETE SET NULL;
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_castes_parent_caste_id ON castes(parent_caste_id);
    `);
    logger.info('Migration applied successfully.');
  } catch (err: any) {
    logger.error('Migration error:', err.message);
  } finally {
    await closeDbPool();
  }
};

applyMigration();
