import { query, closeDbPool } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

const applyIndexes = async () => {
  try {
    logger.info('Creating B-Tree and Composite Indexes on Master Tables...');

    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_districts_state_id ON districts (state_id);',
      'CREATE INDEX IF NOT EXISTS idx_districts_state_name ON districts (state_id, name);',
      'CREATE INDEX IF NOT EXISTS idx_pcs_state_id ON parliamentary_constituencies (state_id);',
      'CREATE INDEX IF NOT EXISTS idx_pcs_state_pc_num ON parliamentary_constituencies (state_id, pc_number);',
      'CREATE INDEX IF NOT EXISTS idx_acs_pc_id ON assembly_constituencies (pc_id);',
      'CREATE INDEX IF NOT EXISTS idx_acs_district_id ON assembly_constituencies (district_id);',
      'CREATE INDEX IF NOT EXISTS idx_acs_ac_number ON assembly_constituencies (ac_number);',
      'CREATE INDEX IF NOT EXISTS idx_booths_ac_id ON booths (ac_id);',
      'CREATE INDEX IF NOT EXISTS idx_booths_ac_booth_num ON booths (ac_id, booth_number);',
      'CREATE INDEX IF NOT EXISTS idx_castes_religion_id ON castes (religion_id);',
      'CREATE INDEX IF NOT EXISTS idx_organizations_ac_id ON organizations (ac_id);',
    ];

    for (const sql of indexQueries) {
      await query(sql);
    }

    logger.info('✅ All Master Table Indexes created successfully.');
  } catch (err: any) {
    logger.error('❌ Index Migration Failed:', err.message);
  } finally {
    await closeDbPool();
  }
};

applyIndexes();
