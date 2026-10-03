import { query as masterQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { logger } from '../../utils/logger';

export class MasterBroadcastSync {
  /**
   * Broadcasts a updated or newly inserted master lookup record to all active tenant databases
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
        .filter((k) => k !== primaryKeyField)
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
        // Asynchronously dispatch update to tenant pool without blocking main flow
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
}
