import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class PcProvisionService {
  static readonly TABLE_NAME = 'parliamentary_constituencies';
  static readonly COLUMNS = ['id', 'state_id', 'pc_number', 'name', 'created_at', 'updated_at'];

  /**
   * Syncs parliamentary constituencies for the given resolved PC IDs.
   */
  static async sync(tenantPool: Pool, pcIds: string[] = []): Promise<{ count: number }> {
    if (!pcIds || pcIds.length === 0) {
      return { count: 0 };
    }

    const res = await masterQuery(
      `SELECT id, state_id, pc_number, name, created_at, updated_at 
       FROM ${this.TABLE_NAME} 
       WHERE id = ANY($1::uuid[])`,
      [pcIds]
    );
    const rows = res.rows;

    if (rows.length > 0) {
      await bulkUpsert(tenantPool, this.TABLE_NAME, this.COLUMNS, rows);
    }

    logger.info(`[PcProvisionService] Synced ${rows.length} parliamentary constituencies.`);
    return { count: rows.length };
  }

  /**
   * Standalone sync for a given tenant ID based on assigned PC and AC scope.
   */
  static async syncForTenant(tenantId: string): Promise<{ count: number }> {
    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);

    const { resolvedPcIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);
    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      return await this.sync(pool, resolvedPcIds);
    } finally {
      await pool.end().catch(() => { });
    }
  }

  /**
   * Prune PCs that are no longer referenced by any AC in the tenant DB.
   */
  static async pruneOrphaned(tenantPool: Pool): Promise<{ deleted: number }> {
    const res = await tenantPool.query(`
      DELETE FROM ${this.TABLE_NAME}
      WHERE id NOT IN (SELECT DISTINCT pc_id FROM assembly_constituencies WHERE pc_id IS NOT NULL)
    `);
    return { deleted: res.rowCount || 0 };
  }

  /**
   * Compare master vs tenant count for the tenant's scoped PCs.
   */
  static async getStats(tenantPool: Pool, pcIds: string[] = []): Promise<{ masterCount: number; tenantCount: number; synced: boolean }> {
    let masterCount = 0;
    if (pcIds.length > 0) {
      const mRes = await masterQuery(
        `SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME} WHERE id = ANY($1::uuid[])`,
        [pcIds]
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
