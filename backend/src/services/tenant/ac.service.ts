import { Pool } from 'pg';
import { MasterAutoSyncService } from '../sync/masterAutoSync.service';
import { logger } from '../../utils/logger';

export class TenantAcService {
  /**
   * Get all ACs in tenant database
   */
  static async getTenantAcs(tenantPool: Pool): Promise<any[]> {
    const res = await tenantPool.query(`
      SELECT * FROM assembly_constituencies ORDER BY ac_number ASC, name ASC
    `);
    return res.rows;
  }

  /**
   * Create a new AC in Tenant DB and AutoSync to Master DB
   */
  static async createTenantAc(
    tenantPool: Pool,
    data: { id?: string; acNo: number; acName: string; districtId?: string; pcId?: string; totalVoters?: number }
  ): Promise<any> {
    const id = data.id || (await tenantPool.query(`SELECT gen_random_uuid() AS id`)).rows[0].id;
    const sql = `
      INSERT INTO assembly_constituencies (id, ac_number, name, district_id, pc_id, total_voters, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const res = await tenantPool.query(sql, [
      id,
      data.acNo,
      data.acName,
      data.districtId || null,
      data.pcId || null,
      data.totalVoters || 0,
    ]);

    const created = res.rows[0];
    logger.info(`[TenantAcService] Created tenant AC '${created.name}' (${created.id})`);

    // AutoSync to Master DB with outbox fallback
    MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'ac',
      created.id,
      'CREATE',
      {
        id: created.id,
        acNo: created.ac_number,
        acName: created.name,
        districtId: created.district_id,
        pcId: created.pc_id,
        totalVoters: created.total_voters,
      }
    ).catch((err) => {
      logger.error(`[TenantAcService] AutoSync error for AC '${created.id}':`, err);
    });

    return created;
  }
}
