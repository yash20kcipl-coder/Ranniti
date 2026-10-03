import { query, closeDbPool } from '../queries/dbPool';
import { logger } from '../utils/logger';
import { FamilyMappingService } from '../services/familyMapping.service';

export async function runFamilyIdBackfill() {
  logger.info('[Backfill] Starting Family ID backfill & booth auto-mapping process...');

  try {
    // 1. Find all distinct family influencers / heads who have linked voters or are flagged as heads
    const headsRes = await query(`
      SELECT DISTINCT v.id, v.family_id AS "familyId", v.booth_id AS "boothId", v.house_no AS "houseNo",
                      b.booth_number AS "boothNumber"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      WHERE (v.is_family_influencer = TRUE OR EXISTS (SELECT 1 FROM voters child WHERE child.family_influencer_id = v.id))
    `);

    const heads = headsRes.rows;
    logger.info(`[Backfill] Found ${heads.length} family head records in database.`);

    for (const head of heads) {
      let familyCode = head.familyId;
      if (!familyCode) {
        const boothNo = head.boothNumber ? String(head.boothNumber).padStart(3, '0') : '000';
        const cleanHouse = FamilyMappingService.normalizeHouseNo(head.houseNo) || 'NA';
        const randomSeq = Math.floor(100 + Math.random() * 900);
        familyCode = `FAM-B${boothNo}-H${cleanHouse}-${randomSeq}`;

        await query(
          `UPDATE voters SET family_id = $1, is_family_influencer = TRUE, updated_at = NOW() WHERE id = $2`,
          [familyCode, head.id]
        );
      }

      // Propagate family_id to all child voters linked to this head
      await query(
        `UPDATE voters SET family_id = $1, updated_at = NOW() WHERE family_influencer_id = $2 AND family_id IS NULL`,
        [familyCode, head.id]
      );
    }

    // 2. Fetch all booths and run autoMapBoothFamilies to cluster remaining unmapped voters
    const boothsRes = await query(`SELECT DISTINCT booth_id FROM voters WHERE booth_id IS NOT NULL`);
    const boothIds = boothsRes.rows.map((r: any) => r.booth_id);

    logger.info(`[Backfill] Auto-mapping families across ${boothIds.length} polling booths...`);
    let totalMapped = 0;

    for (const boothId of boothIds) {
      try {
        const res = await FamilyMappingService.autoMapBoothFamilies({ boothId });
        totalMapped += res.votersMapped;
      } catch (err: any) {
        logger.warn(`[Backfill] Error mapping booth ${boothId}: ${err.message}`);
      }
    }

    logger.info(`[Backfill] Successfully backfilled and auto-mapped ${totalMapped} voters!`);
  } catch (err: any) {
    logger.error(`[Backfill] Error during family ID backfill: ${err.message}`);
  }
}

if (require.main === module) {
  runFamilyIdBackfill()
    .then(() => closeDbPool())
    .catch((err) => {
      console.error(err);
      closeDbPool();
    });
}
