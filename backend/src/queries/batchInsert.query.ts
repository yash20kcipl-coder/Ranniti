import { dbPool, query } from './dbPool';
import { logger } from '../utils/logger';

export interface BatchInsertOptions {
  /**
   * Maximum records per single SQL INSERT statement (default: 2500)
   */
  batchSize?: number;

  /**
   * Unique constraint column(s) for ON CONFLICT clause (e.g. ['epic_number'])
   */
  conflictTarget?: string[];

  /**
   * Conflict resolution strategy: 'DO NOTHING' or 'DO UPDATE' (default: 'DO NOTHING')
   */
  conflictStrategy?: 'DO NOTHING' | 'DO UPDATE';

  /**
   * Columns to update if conflictStrategy is 'DO UPDATE'
   */
  updateColumns?: string[];

  /**
   * If true, wraps each updated column with COALESCE so that a null
   * value from the import never overwrites an existing non-null DB value.
   * Default: true (safe mode on by default).
   */
  coalesceUpdate?: boolean;

  /**
   * Optional raw SQL expressions appended to the DO UPDATE SET clause,
   * e.g. 'updated_at = NOW()'. Comma is added automatically.
   */
  extraUpdateSql?: string;
}

export interface BatchInsertResult {
  totalRecords: number;
  insertedCount: number;
  batchCount: number;
  durationMs: number;
}

/**
 * Executes high-performance batch-wise multi-row INSERT queries in PostgreSQL.
 * Optimized for importing 100,000+ entries fast without exhausting parameter limits.
 */
export class BatchInsertQuery {
  /**
   * Generates a single parameterized multi-row INSERT query string & parameters array.
   */
  static buildMultiRowSql<T extends Record<string, any>>(
    tableName: string,
    records: T[],
    columns: string[],
    options: BatchInsertOptions = {}
  ): { sql: string; params: any[] } {
    if (records.length === 0 || columns.length === 0) {
      throw new Error('Records and columns must not be empty for batch insert');
    }

    const quotedTable = `"${tableName}"`;
    const quotedCols = columns.map((col) => `"${col}"`).join(', ');

    const params: any[] = [];
    const valueRows: string[] = [];

    records.forEach((record, rowIndex) => {
      const rowPlaceholders: string[] = [];
      columns.forEach((col) => {
        params.push(record[col] !== undefined ? record[col] : null);
        rowPlaceholders.push(`$${params.length}`);
      });
      valueRows.push(`(${rowPlaceholders.join(', ')})`);
    });

    let sql = `INSERT INTO ${quotedTable} (${quotedCols}) VALUES ${valueRows.join(', ')}`;

    if (options.conflictTarget && options.conflictTarget.length > 0) {
      const targetCols = options.conflictTarget.map((c) => `"${c}"`).join(', ');

      if (options.conflictStrategy === 'DO UPDATE' && options.updateColumns && options.updateColumns.length > 0) {
        // coalesceUpdate defaults to TRUE — never overwrite existing data with nulls from import
        const useCoalesce = options.coalesceUpdate !== false;
        const updateAssignments = options.updateColumns
          .map((col) =>
            useCoalesce
              ? `"${col}" = COALESCE(EXCLUDED."${col}", "${tableName}"."${col}")`
              : `"${col}" = EXCLUDED."${col}"`
          )
          .join(', ');
        const extraSql = options.extraUpdateSql ? `, ${options.extraUpdateSql}` : '';
        sql += ` ON CONFLICT (${targetCols}) DO UPDATE SET ${updateAssignments}${extraSql}`;
      } else {
        sql += ` ON CONFLICT (${targetCols}) DO NOTHING`;
      }
    }

    return { sql, params };
  }

  /**
   * Executes batch-wise database import in controlled chunks.
   */
  static async executeBatchImport<T extends Record<string, any>>(
    tableName: string,
    records: T[],
    columns: string[],
    options: BatchInsertOptions = {}
  ): Promise<BatchInsertResult> {
    const startTime = process.hrtime.bigint();
    const chunkSize = options.batchSize || 2500;
    
    // PostgreSQL maximum parameters per query limit is 65535.
    // Calculate max allowed records per chunk based on column count
    const maxSafeChunk = Math.floor(60000 / Math.max(1, columns.length));
    const effectiveBatchSize = Math.min(chunkSize, maxSafeChunk);

    let totalInserted = 0;
    let batchCount = 0;

    for (let i = 0; i < records.length; i += effectiveBatchSize) {
      const batchChunk = records.slice(i, i + effectiveBatchSize);
      batchCount++;

      const { sql, params } = this.buildMultiRowSql(tableName, batchChunk, columns, options);
      const res = await query(sql, params);
      totalInserted += res.rowCount || batchChunk.length;

      logger.info(
        `[BatchInsertQuery] Batch ${batchCount} inserted ${res.rowCount || batchChunk.length} records into '${tableName}'`
      );
    }

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;

    return {
      totalRecords: records.length,
      insertedCount: totalInserted,
      batchCount,
      durationMs: Math.round(durationMs),
    };
  }
}
