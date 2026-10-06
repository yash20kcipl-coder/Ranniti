import { query } from '../queries/dbPool';
import { masterService } from '../services/superAdmin/master.service';
import religionsCastesData from './data/religions_castes.json';
import { logger } from '../utils/logger';
import { CacheService } from '../services/cache.service';

/**
 * Optional Manual Seeder Utility: Only runs when explicitly executed via CLI.
 */
export async function seedReligionsAndCastes(): Promise<void> {
  logger.info('==========================================');
  logger.info('🕉️ Manual Seeding of Religions, Castes & Subcastes...');
  logger.info('==========================================');

  // Seed Religions
  const existingReligions = await masterService.getReligions();
  const religionMap = new Map<string, string>();
  for (const r of existingReligions) {
    religionMap.set(r.name.toLowerCase().trim(), r.id);
  }

  let newReligionsCount = 0;
  for (const rel of religionsCastesData.religions) {
    const key = rel.name.toLowerCase().trim();
    if (!religionMap.has(key)) {
      try {
        const created = await masterService.createReligion(rel.name);
        religionMap.set(key, created.id);
        newReligionsCount++;
      } catch (err: any) {
        logger.warn(`Skipped Religion '${rel.name}': ${err.message}`);
      }
    }
  }

  // Seed Castes & Subcastes
  const existingCastes = await masterService.getCastes();
  const casteMap = new Map<string, string>();
  for (const c of existingCastes) {
    casteMap.set(c.name.toLowerCase().trim(), c.id);
  }

  let parentCastesCount = 0;
  let subcastesCount = 0;

  for (const casteData of religionsCastesData.castes) {
    const relKey = (casteData.religionName || '').toLowerCase().trim();
    const religionId = religionMap.get(relKey) || null;
    const parentKey = casteData.name.toLowerCase().trim();

    let parentId = casteMap.get(parentKey);
    if (!parentId) {
      try {
        const created = await masterService.createCaste(
          casteData.name,
          casteData.category as any,
          religionId || undefined,
          undefined
        );
        parentId = created.id;
        casteMap.set(parentKey, created.id);
        parentCastesCount++;
      } catch (err: any) {
        const found = await query(`SELECT id FROM castes WHERE LOWER(name) = $1`, [parentKey]);
        parentId = found.rows[0]?.id;
        if (parentId) casteMap.set(parentKey, parentId);
      }
    }

    if (parentId && Array.isArray(casteData.subcastes)) {
      for (const subcasteName of casteData.subcastes) {
        const subKey = subcasteName.toLowerCase().trim();
        if (!casteMap.has(subKey)) {
          try {
            const createdSub = await masterService.createCaste(
              subcasteName,
              casteData.category as any,
              religionId || undefined,
              parentId
            );
            casteMap.set(subKey, createdSub.id);
            subcastesCount++;
          } catch (err: any) {
            // Ignore duplicates
          }
        }
      }
    }
  }

  await CacheService.invalidatePattern('ranniti:masters:castes*');
  logger.info(`✅ Seeded ${newReligionsCount} Religions, ${parentCastesCount} Parent Castes, ${subcastesCount} Subcastes.`);
}
