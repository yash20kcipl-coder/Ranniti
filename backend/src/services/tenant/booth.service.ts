import { Pool } from 'pg';
import { TransactionalOutbox } from '../../utils/transactionalOutbox';

export class TenantBoothService {
  /**
   * Get all Polling Booths in tenant database
   */
  static async getTenantBooths(tenantPool: Pool, acId?: string, wardId?: string): Promise<any[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (acId) {
      params.push(acId);
      conditions.push(`ac_id = $${params.length}`);
    }
    if (wardId) {
      params.push(wardId);
      conditions.push(`ward_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await tenantPool.query(
      `SELECT * FROM booths ${whereClause} ORDER BY booth_number ASC, name ASC`,
      params
    );
    return rows;
  }

  /**
   * Create a new Polling Booth in Tenant DB and atomically enqueue to Outbox for Master DB sync
   */
  static async createTenantBooth(
    tenantPool: Pool,
    data: { id?: string; boothNo: number; boothName: string; acId: string; wardId?: string; totalVoters?: number }
  ): Promise<any> {
    const sql = `
      INSERT INTO booths (id, booth_number, name, ac_id, ward_id, total_voters, created_at, updated_at)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    return TransactionalOutbox.executeAndEnqueue(tenantPool, 'booth', 'CREATE', async (client) => {
      const { rows } = await client.query(sql, [
        data.id || null,
        data.boothNo,
        data.boothName,
        data.acId,
        data.wardId || null,
        data.totalVoters || 0,
      ]);
      return rows[0];
    });
  }
}
