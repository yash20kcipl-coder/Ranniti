import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';

export class VillageProvisionService {
  static readonly TABLE_NAME = 'villages';
  static readonly COLUMNS = ['id', 'taluka_id', 'name', 'created_at', 'updated_at'];

  /**
   * Syncs all village records from master DB into the tenant database.
   */
  static async sync(tenantPool: Pool): Promise<{ count: number }> {
    const res = await masterQuery(
      `SELECT id, taluka_id, name, created_at, updated_at FROM ${this.TABLE_NAME}`
    );
    const rows = res.rows;

    await bulkUpsert(tenantPool, this.TABLE_NAME, this.COLUMNS, rows);
    logger.info(`[VillageProvisionService] Synced ${rows.length} villages.`);

    return { count: rows.length };
  }

  /**
   * Standalone sync for a given tenant ID.
   */
  static async syncForTenant(tenantId: string): Promise<{ count: number }> {
    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);

    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      return await this.sync(pool);
    } finally {
      await pool.end().catch(() => { });
    }
  }

  /**
   * Compare master vs tenant record counts for villages.
   */
  static async getStats(tenantPool: Pool): Promise<{ masterCount: number; tenantCount: number; synced: boolean }> {
    const mRes = await masterQuery(`SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME}`);
    const masterCount = mRes.rows[0]?.total || 0;

    const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME}`);
    const tenantCount = tRes.rows[0]?.total || 0;

    return {
      masterCount,
      tenantCount,
      synced: masterCount === tenantCount,
    };
  }
}
