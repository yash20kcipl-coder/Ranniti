import { Pool } from 'pg';
import { TransactionalOutbox } from '../../utils/transactionalOutbox';

export class TenantWardService {
  /**
   * Get all Wards in tenant database
   */
  static async getTenantWards(tenantPool: Pool, acId?: string): Promise<any[]> {
    const params = acId ? [acId] : [];
    const whereClause = acId ? 'WHERE ac_id = $1' : '';
    const { rows } = await tenantPool.query(
      `SELECT * FROM wards ${whereClause} ORDER BY ward_number ASC, name ASC`,
      params
    );
    return rows;
  }

  /**
   * Create a new Ward in Tenant DB and atomically enqueue to Outbox for Master DB sync
   */
  static async createTenantWard(
    tenantPool: Pool,
    data: { id?: string; wardNo: number; wardName: string; acId: string; totalVoters?: number }
  ): Promise<any> {
    const sql = `
      INSERT INTO wards (id, ward_number, name, ac_id, created_at, updated_at)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    return TransactionalOutbox.executeAndEnqueue(tenantPool, 'ward', 'CREATE', async (client) => {
      const { rows } = await client.query(sql, [
        data.id || null,
        data.wardNo,
        data.wardName,
        data.acId,
      ]);
      return rows[0];
    });
  }
}
