import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export class VillageProvisionService {
  static readonly TABLE_NAME = 'villages';
  static readonly COLUMNS = ['id', 'taluka_id', 'name', 'created_at', 'updated_at'];

  /**
   * Syncs village records from master DB into the tenant database.
   * If districtIds are provided, syncs all villages belonging to talukas in those districts,
   * plus any villages referenced by booths or voters in acIds to guarantee foreign key integrity.
   */
  static async sync(tenantPool: Pool, districtIds?: string[], acIds?: string[]): Promise<{ count: number }> {
    let queryStr = `SELECT id, taluka_id, name, created_at, updated_at FROM ${this.TABLE_NAME}`;
    const params: any[] = [];

    const hasDistricts = districtIds && districtIds.length > 0;
    const hasAcs = acIds && acIds.length > 0;

    if (hasDistricts && hasAcs) {
      queryStr += ` WHERE taluka_id IN (SELECT id FROM talukas WHERE district_id = ANY($1::uuid[]))
         OR id IN (SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL)
         OR id IN (SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL)`;
      params.push(districtIds, acIds);
    } else if (hasDistricts) {
      queryStr += ` WHERE taluka_id IN (SELECT id FROM talukas WHERE district_id = ANY($1::uuid[]))`;
      params.push(districtIds);
    } else if (hasAcs) {
      queryStr += ` WHERE id IN (SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL)
         OR id IN (SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL)`;
      params.push(acIds);
    }

    const res = await masterQuery(queryStr, params);
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

    const { resolvedAcIds, resolvedDistrictIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);

    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      return await this.sync(pool, resolvedDistrictIds, resolvedAcIds);
    } finally {
      await pool.end().catch(() => { });
    }
  }

  /**
   * Compare master vs tenant record counts for villages.
   */
  static async getStats(tenantPool: Pool, districtIds?: string[], acIds?: string[]): Promise<{ masterCount: number; tenantCount: number; synced: boolean }> {
    let masterQueryStr = `SELECT COUNT(*)::int AS total FROM ${this.TABLE_NAME}`;
    const params: any[] = [];

    const hasDistricts = districtIds && districtIds.length > 0;
    const hasAcs = acIds && acIds.length > 0;

    if (hasDistricts && hasAcs) {
      masterQueryStr += ` WHERE taluka_id IN (SELECT id FROM talukas WHERE district_id = ANY($1::uuid[]))
         OR id IN (SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL)
         OR id IN (SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($2::uuid[]) AND village_id IS NOT NULL)`;
      params.push(districtIds, acIds);
    } else if (hasDistricts) {
      masterQueryStr += ` WHERE taluka_id IN (SELECT id FROM talukas WHERE district_id = ANY($1::uuid[]))`;
      params.push(districtIds);
    } else if (hasAcs) {
      masterQueryStr += ` WHERE id IN (SELECT DISTINCT village_id FROM booths WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL)
         OR id IN (SELECT DISTINCT village_id FROM voters WHERE ac_id = ANY($1::uuid[]) AND village_id IS NOT NULL)`;
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
