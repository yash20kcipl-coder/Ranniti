import { logger } from './logger';
import { Pool, PoolClient } from 'pg';
import { MasterAutoSyncService } from '../services/sync/masterAutoSync.service';

export type MutationFnResult<T> =
  | T
  | { entityId: string; payload: Record<string, any>; result: T };

export class TransactionalOutbox {
  /**
   * Executes a database mutation and enqueues a pending outbox record
   * within the exact same database transaction on the tenant pool.
   * Immediately dispatches an asynchronous outbox sync without blocking the caller.
   */
  static async executeAndEnqueue<T extends Record<string, any>>(
    tenantPool: Pool,
    entityType: 'ac' | 'ward' | 'booth' | 'voter',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    mutationFn: (client: PoolClient) => Promise<MutationFnResult<T>>,
    origin: 'tenant' | 'master' = 'tenant'
  ): Promise<T> {
    const client = await tenantPool.connect();
    let entityId: string;
    let payload: Record<string, any>;
    let finalResult: T;
    let outboxId: string;

    try {
      await client.query('BEGIN');
      const mutationOutcome = await mutationFn(client);

      if (
        mutationOutcome &&
        typeof mutationOutcome === 'object' &&
        'entityId' in mutationOutcome &&
        'payload' in mutationOutcome &&
        'result' in mutationOutcome
      ) {
        entityId = mutationOutcome.entityId;
        payload = mutationOutcome.payload;
        finalResult = mutationOutcome.result;
      } else {
        finalResult = mutationOutcome as T;
        entityId = (finalResult.id || finalResult.entityId || finalResult.epic_no || finalResult.epicNo) as string;
        payload = finalResult;
      }

      const outboxSql = `
        INSERT INTO tenant_sync_outbox (entity_type, entity_id, action, payload, origin, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
        RETURNING id;
      `;
      const outboxRes = await client.query(outboxSql, [
        entityType,
        entityId,
        action,
        JSON.stringify(payload),
        origin,
      ]);
      outboxId = outboxRes.rows[0].id;

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => { });
      throw err;
    } finally {
      client.release();
    }

    // Trigger immediate asynchronous flush to Master DB (non-blocking for HTTP response)
    if (origin !== 'master') {
      MasterAutoSyncService.syncEntityToMaster(
        tenantPool,
        entityType,
        entityId,
        action,
        payload,
        true, // isRetry=true prevents duplicate insertion since outbox row is already committed
        origin
      )
        .then(async (success) => {
          const updateSql = success
            ? `UPDATE tenant_sync_outbox SET status = 'synced', updated_at = NOW() WHERE id = $1`
            : `UPDATE tenant_sync_outbox SET status = 'failed', retry_count = retry_count + 1, updated_at = NOW() WHERE id = $1`;
          await tenantPool.query(updateSql, [outboxId]).catch(() => { });
        })
        .catch((err) => {
          logger.warn(`[TransactionalOutbox] Immediate sync dispatch failed for ${entityType} (${entityId}): ${err.message}`);
        });
    }

    return finalResult;
  }
}
