import { query, closeDbPool } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

const applyMigration = async () => {
  try {
    logger.info('Applying migration to remove code column from states and districts...');
    await query('ALTER TABLE states DROP COLUMN IF EXISTS code CASCADE;');
    await query('ALTER TABLE districts DROP COLUMN IF EXISTS code CASCADE;');
    await query('ALTER TABLE states ADD CONSTRAINT unq_state_name UNIQUE (name);').catch(() => {});
    await query('ALTER TABLE districts ADD CONSTRAINT unq_district_state_name UNIQUE (state_id, name);').catch(() => {});
    logger.info('Migration applied successfully.');
  } catch (err: any) {
    logger.error('Migration error:', err.message);
  } finally {
    await closeDbPool();
  }
};

applyMigration();
