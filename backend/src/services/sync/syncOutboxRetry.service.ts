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
    // Ensure tenant_sync_outbox table exists in this tenant DB
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS tenant_sync_outbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(20) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        retry_count INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const selectSql = `
      SELECT id, entity_type, entity_id, action, payload, retry_count
      FROM tenant_sync_outbox
      WHERE status IN ('pending', 'failed') AND retry_count < 10
      ORDER BY created_at ASC
      LIMIT 500;
    `;

    const pending = await tenantPool.query(selectSql);
    if (!pending.rows || pending.rows.length === 0) return 0;

    let processedCount = 0;

    // Group voter upsert entries for high-speed micro-batch sync
    const voterUpserts: any[] = [];
    const voterOutboxIds: string[] = [];
    const otherItems: any[] = [];

    for (const item of pending.rows) {
      const payloadObj = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
      if (item.entity_type === 'voter' && (item.action === 'CREATE' || item.action === 'UPDATE')) {
        voterUpserts.push(payloadObj);
        voterOutboxIds.push(item.id);
      } else {
        otherItems.push({ item, payloadObj });
      }
    }

    if (voterUpserts.length > 0) {
      const batchRes = await MasterAutoSyncService.syncVotersBatchToMaster(tenantPool, voterUpserts, true);
      if (batchRes.inserted > 0) {
        await tenantPool.query(
          `UPDATE tenant_sync_outbox SET status = 'synced', updated_at = NOW() WHERE id = ANY($1)`,
          [voterOutboxIds]
        );
        processedCount += batchRes.inserted;
      }
    }

    for (const { item, payloadObj } of otherItems) {
      const success = await MasterAutoSyncService.syncEntityToMaster(
        tenantPool,
        item.entity_type,
        item.entity_id,
        item.action,
        payloadObj,
        true
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
