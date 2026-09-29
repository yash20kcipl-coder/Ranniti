import { query, closeDbPool } from '../../queries/dbPool';
import { logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';

const applyInfluencerFlagsMigration = async () => {
  try {
    logger.info('Adding is_family_influencer and is_social_influencer flags to voters table...');
    const sqlPath = path.join(__dirname, 'add_influencer_flags_to_voters.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await query(sql);
    logger.info('✅ Influencer flags migration executed successfully.');
  } catch (err: any) {
    logger.error('❌ Influencer Flags Migration Failed:', err.message);
  } finally {
    await closeDbPool();
  }
};

applyInfluencerFlagsMigration();
