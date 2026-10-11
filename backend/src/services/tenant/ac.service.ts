import { Pool } from 'pg';
import { TransactionalOutbox } from '../../utils/transactionalOutbox';

export class TenantAcService {
  /**
   * Get all ACs in tenant database
   */
  static async getTenantAcs(tenantPool: Pool): Promise<any[]> {
    const { rows } = await tenantPool.query(`
      SELECT * FROM assembly_constituencies ORDER BY ac_number ASC, name ASC
    `);
    return rows;
  }

  /**
   * Create a new AC in Tenant DB and atomically enqueue to Outbox for Master DB sync
   */
  static async createTenantAc(
    tenantPool: Pool,
    data: { id?: string; acNo: number; acName: string; districtId?: string; pcId?: string; totalVoters?: number }
  ): Promise<any> {
    const sql = `
      INSERT INTO assembly_constituencies (id, ac_number, name, district_id, pc_id, created_at, updated_at)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    return TransactionalOutbox.executeAndEnqueue(tenantPool, 'ac', 'CREATE', async (client) => {
      const { rows } = await client.query(sql, [
        data.id || null,
        data.acNo,
        data.acName,
        data.districtId || null,
        data.pcId || null,
      ]);
      return rows[0];
    });
  }
}
