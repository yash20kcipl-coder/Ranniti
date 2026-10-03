import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { MasterBroadcastSync } from '../sync/masterBroadcastSync.service';

export class SuperAdminReligionService {
  /**
   * Get all religions from Master DB
   */
  static async getAllReligions(): Promise<any[]> {
    const res = await query(`SELECT * FROM religions ORDER BY name ASC`);
    return res.rows;
  }

  /**
   * Create a new religion in Master DB and broadcast to all active tenant DBs
   */
  static async createReligion(data: { name: string }): Promise<any> {
    const res = await query(
      `INSERT INTO religions (name, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING *`,
      [data.name]
    );

    const newReligion = res.rows[0];
    logger.info(`[SuperAdminReligionService] Created religion '${newReligion.name}' (${newReligion.id})`);

    MasterBroadcastSync.broadcastToAllTenants('religions', newReligion).catch((err) => {
      logger.error(`[SuperAdminReligionService] Broadcast error for religion '${newReligion.id}':`, err);
    });

    return newReligion;
  }

  /**
   * Update an existing religion in Master DB and broadcast updates
   */
  static async updateReligion(id: string, data: { name: string }): Promise<any> {
    const res = await query(
      `UPDATE religions
       SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [data.name, id]
    );

    if (res.rowCount === 0) return null;
    const updated = res.rows[0];

    MasterBroadcastSync.broadcastToAllTenants('religions', updated).catch((err) => {
      logger.error(`[SuperAdminReligionService] Broadcast error on update for religion '${id}':`, err);
    });

    return updated;
  }

  /**
   * Delete religion from Master DB
   */
  static async deleteReligion(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM religions WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}
