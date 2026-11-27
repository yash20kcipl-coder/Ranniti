import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { bulkUpsert } from '../helpers/bulkUpsert';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';

export class ProfessionProvisionService {
  static readonly CATEGORY_TABLE = 'profession_categories';
  static readonly CATEGORY_COLUMNS = ['id', 'name', 'created_at', 'updated_at'];

  static readonly PROFESSION_TABLE = 'professions';
  static readonly PROFESSION_COLUMNS = ['id', 'category_id', 'name', 'created_at', 'updated_at'];

  /**
   * Syncs all profession categories and professions from master DB into the tenant database.
   */
  static async sync(tenantPool: Pool): Promise<{ count: number }> {
    // 1. Sync Categories
    const catRes = await masterQuery(
      `SELECT id, name, created_at, updated_at FROM ${this.CATEGORY_TABLE}`
    );
    const catRows = catRes.rows;
    await bulkUpsert(tenantPool, this.CATEGORY_TABLE, this.CATEGORY_COLUMNS, catRows);
    logger.info(`[ProfessionProvisionService] Synced ${catRows.length} profession categories.`);

    // 2. Sync Specific Professions
    const profRes = await masterQuery(
      `SELECT id, category_id, name, created_at, updated_at FROM ${this.PROFESSION_TABLE}`
    );
    const profRows = profRes.rows;
    await bulkUpsert(tenantPool, this.PROFESSION_TABLE, this.PROFESSION_COLUMNS, profRows);
    logger.info(`[ProfessionProvisionService] Synced ${profRows.length} professions.`);

    return { count: catRows.length + profRows.length };
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
   * Compare master vs tenant record counts for profession categories & professions.
   */
  static async getStats(tenantPool: Pool): Promise<{ masterCount: number; tenantCount: number; synced: boolean }> {
    const mCatRes = await masterQuery(`SELECT COUNT(*)::int AS total FROM ${this.CATEGORY_TABLE}`);
    const mProfRes = await masterQuery(`SELECT COUNT(*)::int AS total FROM ${this.PROFESSION_TABLE}`);
    const masterCount = (mCatRes.rows[0]?.total || 0) + (mProfRes.rows[0]?.total || 0);

    const tCatRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM ${this.CATEGORY_TABLE}`);
    const tProfRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM ${this.PROFESSION_TABLE}`);
    const tenantCount = (tCatRes.rows[0]?.total || 0) + (tProfRes.rows[0]?.total || 0);

    return {
      masterCount,
      tenantCount,
      synced: masterCount === tenantCount,
    };
  }
}
