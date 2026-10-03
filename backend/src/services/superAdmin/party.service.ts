import { query } from '../../queries/dbPool';
import { MasterBroadcastSync } from '../sync/masterBroadcastSync.service';
import { logger } from '../../utils/logger';

export class SuperAdminPartyService {
  /**
   * Get all political parties from Master DB
   */
  static async getAllParties(): Promise<any[]> {
    const res = await query(`SELECT * FROM parties ORDER BY name ASC`);
    return res.rows;
  }

  /**
   * Create a political party in Master DB and broadcast to all active tenant DBs
   */
  static async createParty(data: { name: string; abbreviation?: string; symbolLogo?: string }): Promise<any> {
    const res = await query(
      `INSERT INTO parties (name, abbreviation, symbol_logo, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [data.name, data.abbreviation || null, data.symbolLogo || null]
    );

    const newParty = res.rows[0];
    logger.info(`[SuperAdminPartyService] Created party '${newParty.name}' (${newParty.id})`);

    MasterBroadcastSync.broadcastToAllTenants('parties', newParty).catch((err) => {
      logger.error(`[SuperAdminPartyService] Broadcast error for party '${newParty.id}':`, err);
    });

    return newParty;
  }

  /**
   * Update a political party in Master DB and broadcast updates
   */
  static async updateParty(id: string, data: { name?: string; abbreviation?: string; symbolLogo?: string }): Promise<any> {
    const res = await query(
      `UPDATE parties
       SET name = COALESCE($1, name),
           abbreviation = COALESCE($2, abbreviation),
           symbol_logo = COALESCE($3, symbol_logo),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [data.name, data.abbreviation, data.symbolLogo, id]
    );

    if (res.rowCount === 0) return null;
    const updated = res.rows[0];

    MasterBroadcastSync.broadcastToAllTenants('parties', updated).catch((err) => {
      logger.error(`[SuperAdminPartyService] Broadcast error on update for party '${id}':`, err);
    });

    return updated;
  }

  /**
   * Delete party from Master DB
   */
  static async deleteParty(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM parties WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}
