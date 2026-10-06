import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { CacheService } from '../cache.service';
import { MasterBroadcastSync } from '../sync/masterBroadcastSync.service';

export class SuperAdminCasteService {
  /**
   * Get all castes from Master DB
   */
  static async getAllCastes(): Promise<any[]> {
    const res = await query(`
      SELECT c.*, r.name AS religion_name
      FROM castes c
      LEFT JOIN religions r ON c.religion_id = r.id
      ORDER BY c.name ASC
    `);
    return res.rows;
  }

  /**
   * Create a new caste in Master DB and broadcast to all active tenant DBs.
   * Automatically creates missing Religion or Parent Caste if religionName / parentCasteName is provided.
   */
  static async createCaste(data: {
    name: string;
    category?: string;
    religionId?: string;
    religionName?: string;
    parentCasteId?: string;
    parentCasteName?: string;
  }): Promise<any> {
    let religionId = data.religionId || null;

    if (!religionId && data.religionName && data.religionName.trim()) {
      const cleanRelName = data.religionName.trim();
      const existingRel = await query(`SELECT id FROM religions WHERE LOWER(name) = LOWER($1)`, [cleanRelName]);
      if (existingRel.rows[0]) {
        religionId = existingRel.rows[0].id;
      } else {
        const newRel = await query(
          `INSERT INTO religions (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`,
          [cleanRelName]
        );
        religionId = newRel.rows[0].id;
        logger.info(`[SuperAdminCasteService] Auto-created missing religion '${cleanRelName}' (${religionId})`);
      }
    }

    let parentCasteId = data.parentCasteId || null;
    if (!parentCasteId && data.parentCasteName && data.parentCasteName.trim()) {
      const cleanParentName = data.parentCasteName.trim();
      const existingParent = await query(`SELECT id FROM castes WHERE LOWER(name) = LOWER($1)`, [cleanParentName]);
      if (existingParent.rows[0]) {
        parentCasteId = existingParent.rows[0].id;
      } else {
        const newParent = await query(
          `INSERT INTO castes (name, category, religion_id, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`,
          [cleanParentName, data.category || 'General', religionId]
        );
        parentCasteId = newParent.rows[0].id;
        logger.info(`[SuperAdminCasteService] Auto-created missing parent caste '${cleanParentName}' (${parentCasteId})`);
      }
    }

    const res = await query(
      `INSERT INTO castes (name, category, religion_id, parent_caste_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET
         category = COALESCE(EXCLUDED.category, castes.category),
         religion_id = COALESCE(EXCLUDED.religion_id, castes.religion_id),
         parent_caste_id = COALESCE(EXCLUDED.parent_caste_id, castes.parent_caste_id),
         updated_at = NOW()
       RETURNING *`,
      [data.name, data.category || 'General', religionId, parentCasteId]
    );

    const newCaste = res.rows[0];
    logger.info(`[SuperAdminCasteService] Created caste '${newCaste.name}' (${newCaste.id})`);

    // Asynchronously broadcast to all tenant DBs
    MasterBroadcastSync.broadcastToAllTenants('castes', newCaste).catch((err) => {
      logger.error(`[SuperAdminCasteService] Broadcast error for caste '${newCaste.id}':`, err);
    });

    await CacheService.invalidatePattern('ranniti:masters:castes*');
    return newCaste;
  }

  /**
   * Update an existing caste in Master DB and broadcast updates
   */
  static async updateCaste(id: string, data: { name?: string; category?: string; religionId?: string }): Promise<any> {
    const res = await query(
      `UPDATE castes
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           religion_id = COALESCE($3, religion_id),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [data.name, data.category, data.religionId, id]
    );

    if (res.rowCount === 0) return null;
    const updated = res.rows[0];

    MasterBroadcastSync.broadcastToAllTenants('castes', updated).catch((err) => {
      logger.error(`[SuperAdminCasteService] Broadcast error on update for caste '${id}':`, err);
    });

    await CacheService.invalidatePattern('ranniti:masters:castes*');
    return updated;
  }

  /**
   * Delete caste from Master DB
   */
  static async deleteCaste(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM castes WHERE id = $1`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:castes*');
    return (res.rowCount || 0) > 0;
  }
}
