import { query } from '../../queries/dbPool';
import { MasterBroadcastSync } from '../sync/masterBroadcastSync.service';
import { logger } from '../../utils/logger';

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
   * Create a new caste in Master DB and broadcast to all active tenant DBs
   */
  static async createCaste(data: { name: string; category?: string; religionId?: string; parentCasteId?: string }): Promise<any> {
    const res = await query(
      `INSERT INTO castes (name, category, religion_id, parent_caste_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [data.name, data.category || null, data.religionId || null, data.parentCasteId || null]
    );

    const newCaste = res.rows[0];
    logger.info(`[SuperAdminCasteService] Created caste '${newCaste.name}' (${newCaste.id})`);

    // Asynchronously broadcast to all tenant DBs
    MasterBroadcastSync.broadcastToAllTenants('castes', newCaste).catch((err) => {
      logger.error(`[SuperAdminCasteService] Broadcast error for caste '${newCaste.id}':`, err);
    });

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

    return updated;
  }

  /**
   * Delete caste from Master DB
   */
  static async deleteCaste(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM castes WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}
