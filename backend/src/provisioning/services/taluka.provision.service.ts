import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class TalukaProvisionService {
  static readonly TABLE_NAME = 'talukas';
  static readonly COLUMNS = ['id', 'district_id', 'name', 'created_at', 'updated_at'];

  /**
   * Syncs taluka records from master DB into the tenant database.
   * If districtIds are provided, syncs talukas belonging to those districts,
   * plus any talukas required by villages linked to booths/voters in acIds.
   */
  static async sync(tenantPool: Pool, districtIds?: string[], acIds?: string[]): Promise<{ count: number }> {
    let queryStr = `SELECT id, district_id, name, created_at, updated_at FROM ${this.TABLE_NAME}`;
    const params: any[] = [];

    const hasDistricts = districtIds && districtIds.length > 0;
    const hasAcs = acIds && acIds.length > 0;

    if (hasDistricts && hasAcs) {
      queryStr += ` WHERE district_id = ANY($1::uuid[])
         OR id IN (
           SELECT DISTINCT taluka_id FROM villages
           WHERE id IN (
             SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL
             UNION
             SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL
           )
         )`;
      params.push(districtIds, acIds);
    } else if (hasDistricts) {
      queryStr += ` WHERE district_id = ANY($1::uuid[])`;
      params.push(districtIds);
    } else if (hasAcs) {
      queryStr += ` WHERE id IN (
         SELECT DISTINCT taluka_id FROM villages
         WHERE id IN (
           SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL
           UNION
           SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL
         )
       )`;
      params.push(acIds);
    }

    const res = await masterQuery(queryStr, params);
    const rows = res.rows;

    await bulkUpsert(tenantPool, this.TABLE_NAME, this.COLUMNS, rows);

    if (hasDistricts || hasAcs) {
      const validIds = rows.map((r: any) => r.id);
      if (validIds.length > 0) {
        await tenantPool.query(
          `DELETE FROM ${this.TABLE_NAME}
           WHERE NOT (id = ANY($1::uuid[]))
             AND id NOT IN (SELECT DISTINCT taluka_id FROM villages WHERE taluka_id IS NOT NULL)`,
          [validIds]
        );
      } else {
        await tenantPool.query(
          `DELETE FROM ${this.TABLE_NAME}
           WHERE id NOT IN (SELECT DISTINCT taluka_id FROM villages WHERE taluka_id IS NOT NULL)`
        );
      }
    }

    logger.info(`[TalukaProvisionService] Synced ${rows.length} talukas.`);

    return { count: rows.length };
  }

  /**
   * Standalone sync for a given tenant ID.
   */
  static async syncForTenant(tenantId: string): Promise<{ count: number }> {
    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);

    const { resolvedAcIds, resolvedDistrictIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);

    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      return await this.sync(pool, resolvedDistrictIds, resolvedAcIds);
    } finally {
      await pool.end().catch(() => { });
    }
  }

  /**
   * Compare master vs tenant record counts for talukas.
   */
  static async getStats(tenantPool: Pool, districtIds?: string[], acIds?: string[]): Promise<{ masterCount: number; tenantCount: number; synced: boolean }> {
    let masterQueryStr = `SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME}`;
    const params: any[] = [];

    const hasDistricts = districtIds && districtIds.length > 0;
    const hasAcs = acIds && acIds.length > 0;

    if (hasDistricts && hasAcs) {
      masterQueryStr += ` WHERE district_id = ANY($1::uuid[])
         OR id IN (
           SELECT DISTINCT taluka_id FROM villages
           WHERE id IN (
             SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL
             UNION
             SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL
           )
         )`;
      params.push(districtIds, acIds);
    } else if (hasDistricts) {
      masterQueryStr += ` WHERE district_id = ANY($1::uuid[])`;
      params.push(districtIds);
    } else if (hasAcs) {
      masterQueryStr += ` WHERE id IN (
         SELECT DISTINCT taluka_id FROM villages
         WHERE id IN (
           SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL
           UNION
           SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL
         )
       )`;
      params.push(acIds);
    }

    const mRes = await masterQuery(masterQueryStr, params);
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
