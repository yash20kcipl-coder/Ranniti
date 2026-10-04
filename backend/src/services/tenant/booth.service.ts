import { Pool } from 'pg';
import { MasterAutoSyncService } from '../sync/masterAutoSync.service';
import { logger } from '../../utils/logger';

export class TenantBoothService {
  /**
   * Get all Polling Booths in tenant database
   */
  static async getTenantBooths(tenantPool: Pool, acId?: string, wardId?: string): Promise<any[]> {
    let sql = `SELECT * FROM booths WHERE 1=1`;
    const params: any[] = [];
    let p = 1;

    if (acId) {
      sql += ` AND ac_id = $${p++}`;
      params.push(acId);
    }
    if (wardId) {
      sql += ` AND ward_id = $${p++}`;
      params.push(wardId);
    }

    sql += ` ORDER BY booth_number ASC, name ASC`;
    const res = await tenantPool.query(sql, params);
    return res.rows;
  }

  /**
   * Create a new Polling Booth in Tenant DB and AutoSync to Master DB
   */
  static async createTenantBooth(
    tenantPool: Pool,
    data: { id?: string; boothNo: number; boothName: string; acId: string; wardId?: string; totalVoters?: number }
  ): Promise<any> {
    const id = data.id || (await tenantPool.query(`SELECT gen_random_uuid() AS id`)).rows[0].id;
    const sql = `
      INSERT INTO booths (id, booth_number, name, ac_id, ward_id, total_voters, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const res = await tenantPool.query(sql, [
      id,
      data.boothNo,
      data.boothName,
      data.acId,
      data.wardId || null,
      data.totalVoters || 0,
    ]);

    const created = res.rows[0];
    logger.info(`[TenantBoothService] Created tenant booth '${created.name}' (${created.id})`);

    MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'booth',
      created.id,
      'CREATE',
      {
        id: created.id,
        boothNumber: created.booth_number,
        name: created.name,
        acId: created.ac_id,
        wardId: created.ward_id,
        villageId: created.village_id,
        totalVoters: created.total_voters,
      }
    ).catch((err) => {
      logger.error(`[TenantBoothService] AutoSync error for Booth '${created.id}':`, err);
    });

    return created;
  }
}
