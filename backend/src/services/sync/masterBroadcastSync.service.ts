import { query as masterQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { logger } from '../../utils/logger';

export class MasterBroadcastSync {
  /**
   * Broadcasts an updated or newly inserted master lookup record to all active tenant databases
   */
  static async broadcastToAllTenants(
    tableName: string,
    recordData: Record<string, any>,
    primaryKeyField = 'id'
  ): Promise<void> {
    try {
      const activeTenants = await masterQuery(
        `SELECT tenant_db_name AS db_name FROM tenant_assignments WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
      );

      if (!activeTenants.rows || activeTenants.rows.length === 0) {
        return;
      }

      const keys = Object.keys(recordData);
      if (keys.length === 0) return;

      const columns = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
      const updateAssigns = keys
        .filter((k) => k !== primaryKeyField && k !== 'created_at')
        .map((k) => `"${k}" = EXCLUDED."${k}"`)
        .join(', ');

      const upsertSql = `
        INSERT INTO ${tableName} (${columns})
        VALUES (${placeholders})
        ON CONFLICT ("${primaryKeyField}") DO UPDATE SET ${updateAssigns}, updated_at = CURRENT_TIMESTAMP;
      `;

      const values = keys.map((k) => recordData[k]);

      for (const tenant of activeTenants.rows) {
        const tenantDbName = tenant.db_name;
        TenantPoolManager.getPool(tenantDbName)
          .query(upsertSql, values)
          .then(() => {
            logger.info(`[BroadcastSync] Successfully propagated ${tableName} (${recordData[primaryKeyField]}) to ${tenantDbName}`);
          })
          .catch((err) => {
            logger.error(`[BroadcastSync] Failed to propagate ${tableName} to ${tenantDbName}:`, err);
          });
      }
    } catch (err) {
      logger.error(`[BroadcastSync] Error fetching active tenants for broadcast of ${tableName}:`, err);
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
    if (!records || records.length === 0) return;

    try {
      const activeTenants = await masterQuery(
        `SELECT tenant_db_name AS db_name FROM tenant_assignments WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
      );

      if (!activeTenants.rows || activeTenants.rows.length === 0) return;

      const keys = Object.keys(records[0]);
      if (keys.length === 0) return;

      const columns = keys.map((k) => `"${k}"`).join(', ');
      const updateAssigns = keys
        .filter((k) => k !== primaryKeyField && k !== 'created_at')
        .map((k) => `"${k}" = EXCLUDED."${k}"`)
        .join(', ');

      const CHUNK = 500;
      for (const tenant of activeTenants.rows) {
        const tenantDbName = tenant.db_name;
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
            ? `ON CONFLICT ("${primaryKeyField}") DO UPDATE SET ${updateAssigns}, updated_at = CURRENT_TIMESTAMP`
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
      }
    } catch (err) {
      logger.error(`[BroadcastSync] Error in batch broadcast of ${tableName}:`, err);
    }
  }

  /**
   * Broadcasts a scoped record (booth, voter, ward) only to tenants assigned to that AC
   */
  static async broadcastToScopedTenants(
    tableName: string,
    recordData: Record<string, any>,
    acId: string,
    primaryKeyField = 'id'
  ): Promise<void> {
    if (!acId) return;

    try {
      const scopedTenants = await masterQuery(
        `SELECT tenant_db_name AS db_name FROM tenant_assignments WHERE status IN ('ready', 'active') AND $1 = ANY(ac_ids) AND tenant_db_name IS NOT NULL`,
        [acId]
      );

      if (!scopedTenants.rows || scopedTenants.rows.length === 0) return;

      const keys = Object.keys(recordData);
      if (keys.length === 0) return;

      const columns = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
      const updateAssigns = keys
        .filter((k) => k !== primaryKeyField && k !== 'created_at')
        .map((k) => `"${k}" = EXCLUDED."${k}"`)
        .join(', ');

      const upsertSql = `
        INSERT INTO ${tableName} (${columns})
        VALUES (${placeholders})
        ON CONFLICT ("${primaryKeyField}") DO UPDATE SET ${updateAssigns}, updated_at = CURRENT_TIMESTAMP;
      `;
      const values = keys.map((k) => recordData[k]);

      for (const tenant of scopedTenants.rows) {
        TenantPoolManager.getPool(tenant.db_name)
          .query(upsertSql, values)
          .catch((err) => {
            logger.error(`[BroadcastSync] Scoped error for ${tableName} to ${tenant.db_name}:`, err);
          });
      }
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
      const scopedTenants = await masterQuery(
        `SELECT tenant_db_name AS db_name FROM tenant_assignments WHERE status IN ('ready', 'active') AND $1 = ANY(ac_ids) AND tenant_db_name IS NOT NULL`,
        [acId]
      );

      if (!scopedTenants.rows || scopedTenants.rows.length === 0) return;

      const keys = Object.keys(records[0]);
      if (keys.length === 0) return;

      const columns = keys.map((k) => `"${k}"`).join(', ');
      const updateAssigns = keys
        .filter((k) => k !== primaryKeyField && k !== 'created_at')
        .map((k) => `"${k}" = EXCLUDED."${k}"`)
        .join(', ');

      const CHUNK = 500;
      for (const tenant of scopedTenants.rows) {
        const tenantDbName = tenant.db_name;
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
            ? `ON CONFLICT ("${primaryKeyField}") DO UPDATE SET ${updateAssigns}, updated_at = CURRENT_TIMESTAMP`
            : `ON CONFLICT ("${primaryKeyField}") DO NOTHING`;

          try {
            await tenantPool.query(
              `INSERT INTO ${tableName} (${columns}) VALUES ${valueTuples.join(', ')} ${conflictClause}`,
              params
            );
          } catch (err) {
            logger.error(`[BroadcastSync] Scoped batch error for ${tableName} to ${tenantDbName}:`, err);
          }
        }
      }
    } catch (err) {
      logger.error(`[BroadcastSync] Error in scoped batch broadcast of ${tableName}:`, err);
    }
  }
}

