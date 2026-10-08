import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class WardProvisionService {
  static readonly TABLE_NAME = 'wards';
  static readonly COLUMNS = ['id', 'ac_id', 'ward_number', 'name', 'created_at', 'updated_at'];

  /**
   * Syncs wards scoped to the tenant's assigned AC IDs.
   */
  static async sync(tenantPool: Pool, acIds: string[] = []): Promise<{ count: number }> {
    if (!acIds || acIds.length === 0) {
      return { count: 0 };
    }

    const res = await masterQuery(
      `SELECT id, ac_id, ward_number, name, created_at, updated_at 
       FROM ${this.TABLE_NAME} 
       WHERE ac_id = ANY($1::uuid[])`,
      [acIds]
    );
    const rows = res.rows;

    if (rows.length > 0) {
      await bulkUpsert(tenantPool, this.TABLE_NAME, this.COLUMNS, rows);
    }

    logger.info(`[WardProvisionService] Synced ${rows.length} wards.`);
    return { count: rows.length };
  }

  /**
   * Ensures that every AC in tenant DB with booths has at least Ward No. 1.
   */
  static async ensureDefaultWards(tenantPool: Pool): Promise<void> {
    await tenantPool.query(`
      WITH missing_ac AS (
        SELECT DISTINCT b.ac_id, a.name AS ac_name
        FROM booths b
        JOIN assembly_constituencies a ON b.ac_id = a.id
        WHERE b.ward_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM wards w WHERE w.ac_id = b.ac_id)
      )
      INSERT INTO wards (ac_id, ward_number, name)
      SELECT ac_id, 1, 'Ward No. 1 (' || ac_name || ')'
      FROM missing_ac
      ON CONFLICT (ac_id, ward_number) DO NOTHING;
    `);
  }

  /**
   * Standalone sync for a given tenant ID based on assigned AC scope.
   */
  static async syncForTenant(tenantId: string): Promise<{ count: number }> {
    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);

    const { resolvedAcIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);
    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const result = await this.sync(pool, resolvedAcIds);
      await this.ensureDefaultWards(pool);
      return result;
    } finally {
      await pool.end().catch(() => { });
    }
  }

  /**
   * Delete wards scoped to removed AC IDs.
   */
  static async removeWardRecords(tenantPool: Pool, removedAcIds: string[]): Promise<{ deleted: number }> {
    if (!removedAcIds.length) return { deleted: 0 };
    const res = await tenantPool.query(
      `DELETE FROM ${this.TABLE_NAME} WHERE ac_id = ANY($1::uuid[])`,
      [removedAcIds]
    );
    return { deleted: res.rowCount || 0 };
  }

  /**
   * Compare master vs tenant count for the tenant's scoped wards.
   */
  static async getStats(tenantPool: Pool, acIds: string[] = []): Promise<{ masterCount: number; tenantCount: number; synced: boolean }> {
    let masterCount = 0;
    if (acIds.length > 0) {
      const mRes = await masterQuery(
        `SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME} WHERE ac_id = ANY($1::uuid[])`,
        [acIds]
      );
      masterCount = mRes.rows[0]?.total || 0;
    }

    const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME}`);
    const tenantCount = tRes.rows[0]?.total || 0;

    return {
      masterCount,
      tenantCount,
      synced: masterCount === tenantCount,
    };
  }
}
