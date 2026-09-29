import { query, closeDbPool } from '../../queries/dbPool';
import { logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';

const applyOutboxMigration = async () => {
  try {
    logger.info('Creating Transactional Outbox Table for Sync Engine...');
    const sqlPath = path.join(__dirname, 'create_sync_outbox_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await query(sql);
    logger.info('✅ Transactional Outbox Table created successfully.');
  } catch (err: any) {
    logger.error('❌ Sync Outbox Migration Failed:', err.message);
  } finally {
    await closeDbPool();
  }
};

applyOutboxMigration();
