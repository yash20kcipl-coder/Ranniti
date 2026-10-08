import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class BoothProvisionService {
  static readonly TABLE_NAME = 'booths';
  static readonly COLUMNS = [
    'id',
    'ac_id',
    'ward_id',
    'village_id',
    'booth_number',
    'name',
    'location_building',
    'total_voters',
    'created_at',
    'updated_at',
  ];

  /**
   * Syncs polling booths scoped to the tenant's assigned AC IDs.
   */
  static async sync(tenantPool: Pool, acIds: string[] = []): Promise<{ count: number }> {
    if (!acIds || acIds.length === 0) {
      return { count: 0 };
    }

    const res = await masterQuery(
      `SELECT id, ac_id, ward_id, village_id, booth_number, name, location_building, total_voters, created_at, updated_at 
       FROM ${this.TABLE_NAME} 
       WHERE ac_id = ANY($1::uuid[])`,
      [acIds]
    );
    const rows = res.rows;

    if (rows.length > 0) {
      await bulkUpsert(tenantPool, this.TABLE_NAME, this.COLUMNS, rows);
    }

    logger.info(`[BoothProvisionService] Synced ${rows.length} booths.`);
    return { count: rows.length };
  }

  /**
   * Fallback to ensure all booths are assigned to a valid ward in the tenant DB.
   */
  static async repairWardAssignments(tenantPool: Pool): Promise<void> {
    await tenantPool.query(`
      UPDATE booths b
      SET ward_id = (SELECT w.id FROM wards w WHERE w.ac_id = b.ac_id ORDER BY w.ward_number ASC LIMIT 1)
      WHERE b.ward_id IS NULL;
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
      await this.repairWardAssignments(pool);
      return result;
    } finally {
      await pool.end().catch(() => { });
    }
  }

  /**
   * Delete booths scoped to removed AC IDs.
   */
  static async removeBoothRecords(tenantPool: Pool, removedAcIds: string[]): Promise<{ deleted: number }> {
    if (!removedAcIds.length) return { deleted: 0 };
    const res = await tenantPool.query(
      `DELETE FROM ${this.TABLE_NAME} WHERE ac_id = ANY($1::uuid[])`,
      [removedAcIds]
    );
    return { deleted: res.rowCount || 0 };
  }

  /**
   * Compare master vs tenant count for the tenant's scoped booths.
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
