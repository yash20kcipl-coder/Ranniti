import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class AcProvisionService {
  static readonly TABLE_NAME = 'assembly_constituencies';
  static readonly COLUMNS = ['id', 'pc_id', 'district_id', 'ac_number', 'name', 'created_at', 'updated_at'];

  /**
   * Syncs assembly constituencies for the given resolved AC IDs.
   * Safety guarantee: Ensures parent PCs exist in the tenant DB prior to AC insertion.
   */
  static async sync(tenantPool: Pool, acIds: string[] = []): Promise<{ count: number }> {
    if (!acIds || acIds.length === 0) {
      return { count: 0 };
    }

    const res = await masterQuery(
      `SELECT id, pc_id, district_id, ac_number, name, created_at, updated_at 
       FROM ${this.TABLE_NAME} 
       WHERE id = ANY($1::uuid[])`,
      [acIds]
    );
    const rows = res.rows;

    if (rows.length > 0) {
      // Safety guarantee: ensure all parent PCs referenced by ACs exist in tenant database before ACs are inserted
      const requiredPcIds = Array.from(new Set(rows.map((r: any) => r.pc_id).filter(Boolean)));
      if (requiredPcIds.length > 0) {
        const pcRows = (
          await masterQuery(
            `SELECT id, state_id, pc_number, name, created_at, updated_at 
             FROM parliamentary_constituencies 
             WHERE id = ANY($1::uuid[])`,
            [requiredPcIds]
          )
        ).rows;

        if (pcRows.length > 0) {
          await bulkUpsert(
            tenantPool,
            'parliamentary_constituencies',
            ['id', 'state_id', 'pc_number', 'name', 'created_at', 'updated_at'],
            pcRows
          );
        }
      }

      await bulkUpsert(tenantPool, this.TABLE_NAME, this.COLUMNS, rows);
    }

    logger.info(`[AcProvisionService] Synced ${rows.length} assembly constituencies.`);
    return { count: rows.length };
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
      return await this.sync(pool, resolvedAcIds);
    } finally {
      await pool.end().catch(() => { });
    }
  }

  /**
   * Delete specific assembly constituencies for removed/de-scoped AC IDs.
   */
  static async removeAcRecords(tenantPool: Pool, removedAcIds: string[]): Promise<{ deleted: number }> {
    if (!removedAcIds.length) return { deleted: 0 };
    const res = await tenantPool.query(
      `DELETE FROM ${this.TABLE_NAME} WHERE id = ANY($1::uuid[])`,
      [removedAcIds]
    );
    return { deleted: res.rowCount || 0 };
  }

  /**
   * Compare master vs tenant count for the tenant's scoped ACs.
   */
  static async getStats(tenantPool: Pool, acIds: string[] = []): Promise<{ masterCount: number; tenantCount: number; synced: boolean }> {
    let masterCount = 0;
    if (acIds.length > 0) {
      const mRes = await masterQuery(
        `SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME} WHERE id = ANY($1::uuid[])`,
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
