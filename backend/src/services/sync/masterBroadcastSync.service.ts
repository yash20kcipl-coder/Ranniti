import { logger } from '../../utils/logger';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../pool/tenantPoolManager';

export class MasterBroadcastSync {
  private static tableColumnsCache = new Map<string, Set<string>>();

  /**
   * Helper to retrieve active tenant database names from tenants table
   */
  private static async getActiveTenantDbNames(acId?: string, pcId?: string): Promise<string[]> {
    try {
      if (acId) {
        const sqlTenants = `
          SELECT tenant_db_name AS db_name
          FROM tenants
          WHERE status IN ('ready', 'active')
            AND tenant_db_name IS NOT NULL
            AND (
              $1::uuid = ANY(ac_ids)
              OR EXISTS (
                SELECT 1 FROM assembly_constituencies a
                WHERE a.id = $1::uuid AND a.pc_id = ANY(pc_ids)
              )
            )
        `;
        const res = await masterQuery(sqlTenants, [acId]);
        return (res.rows || []).map((r: any) => r.db_name).filter(Boolean);
      }
      if (pcId) {
        const sqlTenants = `
          SELECT tenant_db_name AS db_name
          FROM tenants
          WHERE status IN ('ready', 'active')
            AND tenant_db_name IS NOT NULL
            AND (
              $1::uuid = ANY(pc_ids)
              OR EXISTS (
                SELECT 1 FROM assembly_constituencies a
                WHERE a.pc_id = $1::uuid AND a.id = ANY(ac_ids)
              )
            )
        `;
        const res = await masterQuery(sqlTenants, [pcId]);
        return (res.rows || []).map((r: any) => r.db_name).filter(Boolean);
      }
      const sqlTenants = `SELECT tenant_db_name AS db_name FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`;
      const res = await masterQuery(sqlTenants);
      return (res.rows || []).map((r: any) => r.db_name).filter(Boolean);
    } catch (err) {
      logger.error('[BroadcastSync] Error fetching active tenant DB names:', err);
      return [];
    }
  }

  /**
   * Helper to execute operations across tenant DBs with bounded concurrency
   */
  private static async runInChunks<T>(
    items: T[],
    chunkSize: number,
    fn: (item: T) => Promise<void>
  ): Promise<void> {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await Promise.allSettled(chunk.map((item) => fn(item)));
    }
  }

  /**
   * Retrieves column set for a table, caching results in memory
   */
  private static async getTableColumns(tableName: string): Promise<Set<string>> {
    if (this.tableColumnsCache.has(tableName)) {
      return this.tableColumnsCache.get(tableName)!;
    }
    try {
      const res = await masterQuery(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [tableName]
      );
      const set = new Set<string>((res.rows || []).map((r: any) => r.column_name));
      this.tableColumnsCache.set(tableName, set);
      return set;
    } catch (err) {
      logger.error(`[BroadcastSync] Error retrieving columns for ${tableName}:`, err);
      return new Set<string>();
    }
  }

  private static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Normalizes camelCase properties to snake_case table columns and discards extra joined fields
   */
  private static async normalizeRecordForTable(tableName: string, record: Record<string, any>): Promise<Record<string, any>> {
    const validColumns = await this.getTableColumns(tableName);
    const normalized: Record<string, any> = {};

    for (const [key, val] of Object.entries(record)) {
      const snakeKey = this.toSnakeCase(key);
      if (validColumns.has(snakeKey)) {
        normalized[snakeKey] = val;
      } else if (validColumns.has(key)) {
        normalized[key] = val;
      }
    }

    if (validColumns.has('updated_at') && !normalized.updated_at) {
      normalized.updated_at = new Date().toISOString();
    }

    return normalized;
  }

  /**
   * Builds an UPSERT SQL statement with LWW (Last-Write-Wins) protection
   */
  private static buildSingleUpsertSql(tableName: string, keys: string[], primaryKeyField: string): string {
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
    const updateAssigns = keys
      .filter((k) => k !== primaryKeyField && k !== 'created_at' && k !== 'updated_at')
      .map((k) => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    return `
      INSERT INTO ${tableName} (${columns})
      VALUES (${placeholders})
      ON CONFLICT ("${primaryKeyField}") DO UPDATE SET ${updateAssigns}, updated_at = COALESCE(EXCLUDED.updated_at, CURRENT_TIMESTAMP)
      WHERE ${tableName}.updated_at IS NULL OR EXCLUDED.updated_at >= ${tableName}.updated_at;
    `;
  }

  /**
   * Propagates a single record to the given tenant databases
   */
  private static async broadcastSingleToPools(
    tenantDbNames: string[],
    tableName: string,
    recordData: Record<string, any>,
    primaryKeyField = 'id'
  ): Promise<void> {
    const keys = Object.keys(recordData);
    if (keys.length === 0 || tenantDbNames.length === 0) return;

    const upsertSql = this.buildSingleUpsertSql(tableName, keys, primaryKeyField);
    const values = keys.map((k) => recordData[k]);

    await this.runInChunks(tenantDbNames, 5, async (tenantDbName) => {
      try {
        await TenantPoolManager.getPool(tenantDbName).query(upsertSql, values);
        logger.info(`[BroadcastSync] Propagated ${tableName} (${recordData[primaryKeyField]}) to ${tenantDbName}`);
      } catch (err: any) {
        logger.error(`[BroadcastSync] Failed to propagate ${tableName} to ${tenantDbName}:`, err);
      }
    });
  }

  /**
   * Propagates a batch of records to the given tenant databases in chunks
   */
  private static async broadcastBatchToPools(
    tenantDbNames: string[],
    tableName: string,
    records: Record<string, any>[],
    primaryKeyField = 'id'
  ): Promise<void> {
    if (!records || records.length === 0 || tenantDbNames.length === 0) return;

    const keys = Object.keys(records[0]);
    if (keys.length === 0) return;

    const columns = keys.map((k) => `"${k}"`).join(', ');
    const updateAssigns = keys
      .filter((k) => k !== primaryKeyField && k !== 'created_at' && k !== 'updated_at')
      .map((k) => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    const CHUNK = 500;
    await this.runInChunks(tenantDbNames, 5, async (tenantDbName) => {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);

      for (let i = 0; i < records.length; i += CHUNK) {
        const chunk = records.slice(i, i + CHUNK);
        const valueTuples: string[] = [];
        const params: any[] = [];
        let p = 1;

        for (const row of chunk) {
          const placeholders = keys.map(() => `$${p++}`).join(', ');
          valueTuples.push(`(${placeholders})`);
          for (const col of keys) params.push(row[col] ?? null);
        }

        const conflictClause = updateAssigns
          ? `ON CONFLICT ("${primaryKeyField}") DO UPDATE SET ${updateAssigns}, updated_at = COALESCE(EXCLUDED.updated_at, CURRENT_TIMESTAMP) WHERE ${tableName}.updated_at IS NULL OR EXCLUDED.updated_at >= ${tableName}.updated_at`
          : `ON CONFLICT ("${primaryKeyField}") DO NOTHING`;

        try {
          await tenantPool.query(
            `INSERT INTO ${tableName} (${columns}) VALUES ${valueTuples.join(', ')} ${conflictClause}`,
            params
          );
        } catch (err) {
          logger.error(`[BroadcastSync] Batch error for ${tableName} to ${tenantDbName}:`, err);
        }
      }
    });
  }

  /**
   * Broadcasts an updated or newly inserted master lookup record to all active tenant databases
   */
  static async broadcastToAllTenants(
    tableName: string,
    recordData: Record<string, any>,
    primaryKeyField = 'id'
  ): Promise<void> {
    try {
      const tenantDbNames = await this.getActiveTenantDbNames();
      const normalized = await this.normalizeRecordForTable(tableName, recordData);
      await this.broadcastSingleToPools(tenantDbNames, tableName, normalized, primaryKeyField);
    } catch (err) {
      logger.error(`[BroadcastSync] Error broadcasting ${tableName}:`, err);
    }
  }

  /**
   * Broadcasts an array of newly inserted/updated master lookup records to all active tenant databases
   */
  static async broadcastBatchToAllTenants(
    tableName: string,
    records: Record<string, any>[],
    primaryKeyField = 'id'
  ): Promise<void> {
    try {
      const tenantDbNames = await this.getActiveTenantDbNames();
      const normalizedList = await Promise.all(records.map(r => this.normalizeRecordForTable(tableName, r)));
      await this.broadcastBatchToPools(tenantDbNames, tableName, normalizedList, primaryKeyField);
    } catch (err) {
      logger.error(`[BroadcastSync] Error in batch broadcast of ${tableName}:`, err);
    }
  }

  /**
   * Broadcasts a single record (booth, voter, ward) scoped strictly to tenants assigned to that AC
   */
  static async broadcastToScopedTenants(
    tableName: string,
    recordData: Record<string, any>,
    acId: string,
    primaryKeyField = 'id'
  ): Promise<void> {
    if (!acId) return;
    try {
      const tenantDbNames = await this.getActiveTenantDbNames(acId);
      const normalized = await this.normalizeRecordForTable(tableName, recordData);
      await this.broadcastSingleToPools(tenantDbNames, tableName, normalized, primaryKeyField);
    } catch (err) {
      logger.error(`[BroadcastSync] Error in scoped broadcast of ${tableName}:`, err);
    }
  }

  /**
   * Broadcasts an array of scoped records (booths, voters, wards) to tenants assigned to that AC
   */
  static async broadcastBatchToScopedTenants(
    tableName: string,
    records: Record<string, any>[],
    acId: string,
    primaryKeyField = 'id'
  ): Promise<void> {
    if (!acId || !records || records.length === 0) return;
    try {
      const tenantDbNames = await this.getActiveTenantDbNames(acId);
      const normalizedList = await Promise.all(records.map(r => this.normalizeRecordForTable(tableName, r)));
      await this.broadcastBatchToPools(tenantDbNames, tableName, normalizedList, primaryKeyField);
    } catch (err) {
      logger.error(`[BroadcastSync] Error in scoped batch broadcast of ${tableName}:`, err);
    }
  }

  /**
   * Broadcasts deletion of a record to all active tenant databases
   */
  static async broadcastDeleteToAllTenants(
    tableName: string,
    id: string,
    primaryKeyField = 'id'
  ): Promise<void> {
    try {
      const tenantDbNames = await this.getActiveTenantDbNames();
      await this.runInChunks(tenantDbNames, 5, async (tenantDbName) => {
        try {
          await TenantPoolManager.getPool(tenantDbName).query(
            `DELETE FROM ${tableName} WHERE "${primaryKeyField}" = $1`,
            [id]
          );
          logger.info(`[BroadcastSync] Propagated DELETE for ${tableName} (${id}) to ${tenantDbName}`);
        } catch (err: any) {
          logger.error(`[BroadcastSync] Delete error for ${tableName} on ${tenantDbName}:`, err);
        }
      });
    } catch (err) {
      logger.error(`[BroadcastSync] Error in delete broadcast of ${tableName}:`, err);
    }
  }

  /**
   * Broadcasts deletion of a scoped record (booth, ward) to tenants assigned to that AC
   */
  static async broadcastDeleteToScopedTenants(
    tableName: string,
    id: string,
    acId: string,
    primaryKeyField = 'id'
  ): Promise<void> {
    if (!acId) return;
    try {
      const tenantDbNames = await this.getActiveTenantDbNames(acId);
      await this.runInChunks(tenantDbNames, 5, async (tenantDbName) => {
        try {
          await TenantPoolManager.getPool(tenantDbName).query(
            `DELETE FROM ${tableName} WHERE "${primaryKeyField}" = $1`,
            [id]
          );
          logger.info(`[BroadcastSync] Scoped propagated DELETE for ${tableName} (${id}) to ${tenantDbName}`);
        } catch (err: any) {
          logger.error(`[BroadcastSync] Scoped delete error for ${tableName} on ${tenantDbName}:`, err);
        }
      });
    } catch (err) {
      logger.error(`[BroadcastSync] Error in scoped delete broadcast of ${tableName}:`, err);
    }
  }
}
