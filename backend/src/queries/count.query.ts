import { query } from './dbPool';

/**
 * Fast Row Count Queries for PostgreSQL.
 */
export class CountQuery {
  /**
   * Fast estimated row count for massive tables (0.5ms execution time).
   * Uses PostgreSQL query planner statistics (pg_class.reltuples).
   */
  static async getEstimatedRowCount(tableName: string): Promise<number> {
    const sql = `
      SELECT reltuples::bigint AS count 
      FROM pg_class 
      WHERE relname = $1;
    `;
    const res = await query(sql, [tableName]);
    return res.rows.length > 0 ? parseInt(res.rows[0].count, 10) : 0;
  }

  /**
   * Exact filtered count query.
   */
  static async getExactCount(tableName: string, whereClause = '', params: any[] = []): Promise<number> {
    const sql = `SELECT COUNT(*)::bigint AS count FROM "${tableName}"${whereClause}`;
    const res = await query(sql, params);
    return res.rows.length > 0 ? parseInt(res.rows[0].count, 10) : 0;
  }
}
