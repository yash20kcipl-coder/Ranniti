import { query as masterQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { MasterAutoSyncService } from './masterAutoSync.service';
import { logger } from '../../utils/logger';

export class SyncOutboxRetryService {
  private static isProcessing = false;
  private static retryIntervalTimer: NodeJS.Timeout | null = null;

  /**
   * Process pending outbox sync items for a single tenant database
   */
  static async processTenantOutbox(tenantDbName: string): Promise<number> {
    const tenantPool = TenantPoolManager.getPool(tenantDbName);
    const selectSql = `
      SELECT id, entity_type, entity_id, action, payload, retry_count
      FROM tenant_sync_outbox
      WHERE status IN ('pending', 'failed') AND retry_count < 10
      ORDER BY created_at ASC
      LIMIT 50;
    `;

    const pending = await tenantPool.query(selectSql);
    if (!pending.rows || pending.rows.length === 0) return 0;

    let processedCount = 0;

    for (const item of pending.rows) {
      const payloadObj = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
      const success = await MasterAutoSyncService.syncEntityToMaster(
        tenantPool,
        item.entity_type,
        item.entity_id,
        item.action,
        payloadObj
      );

      if (success) {
        await tenantPool.query(
          `UPDATE tenant_sync_outbox SET status = 'synced', updated_at = NOW() WHERE id = $1`,
          [item.id]
        );
        processedCount++;
      } else {
        await tenantPool.query(
          `UPDATE tenant_sync_outbox SET status = 'failed', retry_count = retry_count + 1, updated_at = NOW() WHERE id = $1`,
          [item.id]
        );
      }
    }

    return processedCount;
  }

  /**
   * Scans all active tenant DBs and retries all pending outbox entries
   */
  static async processAllTenantsOutbox(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const activeTenants = await masterQuery(
        `SELECT tenant_db_name AS db_name FROM tenant_assignments WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
      );
      for (const tenant of activeTenants.rows) {
        try {
          const count = await this.processTenantOutbox(tenant.db_name);
          if (count > 0) {
            logger.info(`[SyncOutboxRetry] Synced ${count} outbox records for tenant DB '${tenant.db_name}'`);
          }
        } catch (err: any) {
          logger.error(`[SyncOutboxRetry] Failed outbox processing for tenant DB '${tenant.db_name}':`, err);
        }
      }
    } catch (err: any) {
      logger.error('[SyncOutboxRetry] Error fetching active tenants for outbox retry:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start background worker timer running outbox retries every intervalMs (default: 60s)
   */
  static startBackgroundWorker(intervalMs = 60000): void {
    if (!this.retryIntervalTimer) {
      this.retryIntervalTimer = setInterval(() => {
        this.processAllTenantsOutbox().catch((err) => {
          logger.error('[SyncOutboxRetry] Error in background outbox worker loop:', err);
        });
      }, intervalMs);
      this.retryIntervalTimer.unref();
      logger.info(`[SyncOutboxRetry] Outbox retry background worker started (interval: ${intervalMs}ms)`);
    }
  }

  /**
   * Stop background worker timer
   */
  static stopBackgroundWorker(): void {
    if (this.retryIntervalTimer) {
      clearInterval(this.retryIntervalTimer);
      this.retryIntervalTimer = null;
      logger.info('[SyncOutboxRetry] Outbox retry background worker stopped');
    }
  }
}
