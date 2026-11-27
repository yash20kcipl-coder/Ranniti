import fs from 'fs';
import path from 'path';
import { query, closeDbPool } from '../../queries/dbPool';
import { initialProfessionCategories } from '../data/professions.seed';
import { logger } from '../../utils/logger';
import { CacheService } from '../../services/cache.service';
import { MasterBroadcastSync } from '../../services/sync/masterBroadcastSync.service';
import { generateProfessionsXlsx } from '../generate_professions_import';

export const seedProfessions = async (): Promise<void> => {
  logger.info('====================================================');
  logger.info('💼 Seeding Profession Categories & Specific Professions...');
  logger.info('====================================================');

  // Ensure tables exist
  const migrationPath = path.join(__dirname, '../../database/migrations/create_profession_master_tables.sql');
  if (fs.existsSync(migrationPath)) {
    try {
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      await query(sqlContent);
    } catch (err: any) {
      logger.warn(`Notice while verifying create_profession_master_tables.sql: ${err.message}`);
    }
  }

  let totalCategories = 0;
  let totalProfessions = 0;

  for (const cat of initialProfessionCategories) {
    // 1. Upsert Category
    const catRes = await query(
      `INSERT INTO profession_categories (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
       RETURNING id, name`,
      [cat.name]
    );

    const categoryId = catRes.rows[0].id;
    totalCategories++;
    await MasterBroadcastSync.broadcastToAllTenants('profession_categories', catRes.rows[0]).catch(() => {});

    // 2. Upsert Professions under this category
    for (const profName of cat.professions) {
      const profRes = await query(
        `INSERT INTO professions (category_id, name)
         VALUES ($1, $2)
         ON CONFLICT (category_id, name) DO UPDATE SET updated_at = NOW()
         RETURNING id, category_id, name`,
        [categoryId, profName]
      );
      if (profRes.rows.length > 0) {
        totalProfessions++;
        await MasterBroadcastSync.broadcastToAllTenants('professions', profRes.rows[0]).catch(() => {});
      }
    }
  }

  await CacheService.invalidatePattern('ranniti:masters:profession_categories*');
  await CacheService.invalidatePattern('ranniti:masters:professions*');

  logger.info(`🎉 Successfully seeded ${totalCategories} categories and ${totalProfessions} specific professions.`);

  // Generate standard spreadsheet in xlsx/
  try {
    await generateProfessionsXlsx();
  } catch (err: any) {
    logger.warn(`Notice while generating xlsx/professions.xlsx: ${err.message}`);
  }
};

if (require.main === module) {
  seedProfessions()
    .then(async () => {
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Error during profession seeding:', err);
      await closeDbPool();
      process.exit(1);
    });
}
