import fs from 'fs';
import path from 'path';
import { query, closeDbPool } from '../../queries/dbPool';
import { initialParties } from '../data/masters.seed';
import { logger } from '../../utils/logger';
import { CacheService } from '../../services/cache.service';
import { MasterBroadcastSync } from '../../services/sync/masterBroadcastSync.service';

export const seedParties = async (): Promise<void> => {
  logger.info('==========================================');
  logger.info('🚩 Seeding Political Parties Master Data...');
  logger.info('==========================================');

  // Ensure master table exists
  const migrationPath = path.join(__dirname, '../../database/migrations/create_master_tables.sql');
  if (fs.existsSync(migrationPath)) {
    try {
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      await query(sqlContent);
    } catch (err: any) {
      logger.warn(`Notice while running create_master_tables.sql: ${err.message}`);
    }
  }

  let count = 0;
  const seededRecords: Array<{
    id: string;
    name: string;
    abbreviation: string;
    symbol_logo: string | null;
    alliance: string | null;
  }> = [];

  for (const party of initialParties) {
    try {
      const res = await query(
        `INSERT INTO parties (name, abbreviation, symbol_logo, alliance)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE SET
           abbreviation = EXCLUDED.abbreviation,
           symbol_logo = EXCLUDED.symbol_logo,
           alliance = EXCLUDED.alliance,
           updated_at = NOW()
         RETURNING id, name, abbreviation, symbol_logo, alliance`,
        [party.name, party.abbreviation, party.symbolLogo || null, party.alliance || null]
      );
      if (res.rows.length > 0) {
        seededRecords.push(res.rows[0]);
        count++;
      }
      logger.info(`Seeded Party: ${party.name} (${party.abbreviation})`);
    } catch (err: any) {
      logger.warn(`Failed to seed party '${party.name}': ${err.message}`);
    }
  }

  // Broadcast seeded parties to active tenant databases
  if (seededRecords.length > 0) {
    try {
      await MasterBroadcastSync.broadcastBatchToAllTenants('parties', seededRecords);
      logger.info(`Propagated ${seededRecords.length} political parties to active tenant databases.`);
    } catch (err: any) {
      logger.error('Failed to broadcast parties to active tenant databases:', err);
    }
  }

  await CacheService.invalidatePattern('ranniti:masters:parties*');
  logger.info(`✅ Successfully seeded ${count} Political Parties.`);
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('party.seeder.ts'))) {
  seedParties()
    .then(async () => {
      logger.info('Party Seeder execution complete.');
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Party Seeder execution failed:', err);
      await closeDbPool();
      process.exit(1);
    });
}
