import { Pool } from 'pg';
import { MasterAutoSyncService } from '../sync/masterAutoSync.service';
import { logger } from '../../utils/logger';

export class TenantWardService {
  /**
   * Get all Wards in tenant database
   */
  static async getTenantWards(tenantPool: Pool, acId?: string): Promise<any[]> {
    let sql = `SELECT * FROM wards`;
    const params: any[] = [];
    if (acId) {
      sql += ` WHERE ac_id = $1`;
      params.push(acId);
    }
    sql += ` ORDER BY ward_number ASC, name ASC`;
    const res = await tenantPool.query(sql, params);
    return res.rows;
  }

  /**
   * Create a new Ward in Tenant DB and AutoSync to Master DB
   */
  static async createTenantWard(
    tenantPool: Pool,
    data: { id?: string; wardNo: number; wardName: string; acId: string; totalVoters?: number }
  ): Promise<any> {
    const id = data.id || (await tenantPool.query(`SELECT gen_random_uuid() AS id`)).rows[0].id;
    const sql = `
      INSERT INTO wards (id, ward_number, name, ac_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const res = await tenantPool.query(sql, [
      id,
      data.wardNo,
      data.wardName,
      data.acId,
    ]);

    const created = res.rows[0];
    logger.info(`[TenantWardService] Created tenant Ward '${created.name}' (${created.id})`);

    MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'ward',
      created.id,
      'CREATE',
      {
        id: created.id,
        wardNumber: created.ward_number,
        name: created.name,
        acId: created.ac_id,
      }
    ).catch((err) => {
      logger.error(`[TenantWardService] AutoSync error for Ward '${created.id}':`, err);
    });

    return created;
  }
}
