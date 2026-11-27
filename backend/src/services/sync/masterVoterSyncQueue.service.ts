import { logger } from '../../utils/logger';
import { query as masterQuery, dbPool } from '../../queries/dbPool';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { VoterProvisionService } from '../../provisioning/services/voter.provision.service';
import { CacheService } from '../cache.service';

export interface EnqueueSyncOptions {
  acIds: string[];
  batchId?: string;
  source?: string;
}

export interface SyncQueueJob {
  id: string;
  job_type: string;
  source: string;
  batch_id: string | null;
  ac_id: string;
  tenant_id: string;
  tenant_db_name: string;
  total_voters: number;
  synced_voters: number;
  status: 'pending' | 'processing' | 'completed' | 'retrying' | 'failed';
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  next_retry_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class MasterVoterSyncQueueService {
  private static isWorkerRunning = false;
  private static activeJobsCount = 0;
  private static retryIntervalTimer: NodeJS.Timeout | null = null;
  private static readonly MAX_CONCURRENT_JOBS = 2;
  private static readonly RETRY_BACKOFF_MINUTES = [1, 5, 15, 30, 60];

  /**
   * Enqueues voter sync jobs for all affected ACs to active assigned tenants
   */
  static async enqueueVoterSyncForAcs(options: EnqueueSyncOptions): Promise<string[]> {
    const { acIds, batchId, source = 'bulk_import' } = options;
    const cleanAcIds = (acIds || []).filter(Boolean);
    if (cleanAcIds.length === 0) return [];

    const enqueuedJobIds: string[] = [];

    try {
      // Find all active/ready tenants whose assigned geography covers any of these ACs
      const tenantSql = `
        SELECT t.id, t.tenant_db_name, t.ac_ids, t.pc_ids
        FROM tenants t
        WHERE t.status IN ('ready', 'active')
          AND t.tenant_db_name IS NOT NULL
          AND (
            t.ac_ids && $1::uuid[]
            OR EXISTS (
              SELECT 1 FROM assembly_constituencies a
              WHERE a.id = ANY($1::uuid[]) AND a.pc_id = ANY(t.pc_ids)
            )
          );
      `;
      const tenantRes = await masterQuery(tenantSql, [cleanAcIds]);
      const tenants = tenantRes.rows || [];

      if (tenants.length === 0) {
        logger.info(`[MasterVoterSyncQueue] No active tenants assigned to ACs: [${cleanAcIds.join(', ')}]. No jobs enqueued.`);
        return [];
      }

      for (const acId of cleanAcIds) {
        // Count voters in master DB for this AC
        const countRes = await masterQuery(
          `SELECT COUNT(*)::int AS total FROM voters WHERE ac_id = $1::uuid`,
          [acId]
        );
        const totalVoters = countRes.rows[0]?.total || 0;

        // Filter tenants that cover this specific AC
        const relevantTenants = tenants.filter((t: any) => {
          const directAc = Array.isArray(t.ac_ids) && t.ac_ids.includes(acId);
          return directAc || true; // Already verified by initial query
        });

        for (const tenant of relevantTenants) {
          // Check if an incomplete job already exists for this tenant & AC
          const existingJobRes = await masterQuery(
            `SELECT id, status FROM master_voter_sync_queue
             WHERE tenant_id = $1 AND ac_id = $2 AND status IN ('pending', 'processing', 'retrying')
             LIMIT 1`,
            [tenant.id, acId]
          );

          if (existingJobRes.rows.length > 0) {
            const existingId = existingJobRes.rows[0].id;
            // Update voter total on existing pending job
            await masterQuery(
              `UPDATE master_voter_sync_queue 
               SET total_voters = $1, batch_id = COALESCE($2, batch_id), updated_at = NOW() 
               WHERE id = $3`,
              [totalVoters, batchId || null, existingId]
            );
            enqueuedJobIds.push(existingId);
            logger.info(`[MasterVoterSyncQueue] Updated existing active job ${existingId} for tenant ${tenant.tenant_db_name} (AC: ${acId})`);
            continue;
          }

          // Insert new queue job
          const insertSql = `
            INSERT INTO master_voter_sync_queue (
              job_type, source, batch_id, ac_id, tenant_id, tenant_db_name,
              total_voters, synced_voters, status, retry_count, max_retries,
              next_retry_at, created_at, updated_at
            ) VALUES (
              'voter_sync', $1, $2, $3, $4, $5,
              $6, 0, 'pending', 0, 5,
              NOW(), NOW(), NOW()
            ) RETURNING id;
          `;
          const insertRes = await masterQuery(insertSql, [
            source,
            batchId || null,
            acId,
            tenant.id,
            tenant.tenant_db_name,
            totalVoters,
          ]);

          const jobId = insertRes.rows[0].id;
          enqueuedJobIds.push(jobId);
          logger.info(`[MasterVoterSyncQueue] Enqueued voter sync job ${jobId} for tenant ${tenant.tenant_db_name} (AC: ${acId}, ${totalVoters} voters)`);
        }
      }

      // Trigger background processing asynchronously
      this.triggerWorker();
    } catch (err: any) {
      logger.error(`[MasterVoterSyncQueue] Error enqueuing voter sync:`, err);
    }

    return enqueuedJobIds;
  }

  /**
   * Dispatches the queue worker asynchronously without blocking the caller
   */
  static triggerWorker(): void {
    setImmediate(() => {
      this.processQueue().catch((err) => {
        logger.error(`[MasterVoterSyncQueue] Worker execution encountered unhandled error:`, err);
      });
    });
  }

  /**
   * Main queue worker execution loop
   */
  static async processQueue(): Promise<void> {
    if (this.isWorkerRunning) {
      return;
    }
    this.isWorkerRunning = true;

    try {
      while (this.activeJobsCount < this.MAX_CONCURRENT_JOBS) {
        // Atomically claim the next eligible job
        const claimSql = `
          UPDATE master_voter_sync_queue
          SET status = 'processing',
              started_at = NOW(),
              updated_at = NOW()
          WHERE id = (
            SELECT id FROM master_voter_sync_queue
            WHERE status IN ('pending', 'retrying')
              AND (next_retry_at IS NULL OR next_retry_at <= NOW())
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          RETURNING *;
        `;
        const claimRes = await masterQuery(claimSql);
        if (!claimRes.rows || claimRes.rows.length === 0) {
          // No jobs currently eligible
          break;
        }

        const job: SyncQueueJob = claimRes.rows[0];
        this.activeJobsCount++;

        // Process job asynchronously with bounded concurrency
        this.executeJob(job)
          .catch((err) => {
            logger.error(`[MasterVoterSyncQueue] Job ${job.id} unexpected failure:`, err);
          })
          .finally(() => {
            this.activeJobsCount--;
            // Check for additional queued work
            this.triggerWorker();
          });
      }
    } finally {
      this.isWorkerRunning = false;
    }
  }

  /**
   * Executes a single voter sync job with chunking, index safety, and retry logic
   */
  private static async executeJob(job: SyncQueueJob): Promise<void> {
    const { id: jobId, ac_id: acId, tenant_id: tenantId, tenant_db_name: tenantDbName } = job;
    logger.info(`[MasterVoterSyncQueue] 🚀 Starting job ${jobId} -> syncing voters for AC ${acId} to '${tenantDbName}'`);
    console.log('[MasterVoterSyncQueue] 🚀 Running voter sync job:', {
      jobId,
      acId,
      tenantId,
      tenantDbName,
      status: job.status,
      retryCount: job.retry_count,
      totalVoters: job.total_voters,
      syncedVoters: job.synced_voters,
    });

    let tenantPool: any = null;
    let masterClient: any = null;

    try {
      tenantPool = TenantPoolManager.getPool(tenantDbName);

      // Verify tenant connection
      const testConn = await tenantPool.query('SELECT 1');
      if (!testConn) throw new Error(`Could not connect to tenant database '${tenantDbName}'`);

      // 1. Temporarily drop secondary & GIN search indexes on tenant DB
      await VoterProvisionService.dropSecondaryAndSearchIndexes(tenantPool);

      // 2. Stream & upsert voters from Master DB to Tenant DB
      masterClient = await dbPool.connect();
      await masterClient.query('SET statement_timeout = 300000'); // 5 minutes timeout

      // Inspect target columns on tenant DB voters table
      const colRes = await tenantPool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'voters'`
      );
      const targetCols = new Set<string>((colRes.rows || []).map((r: any) => r.column_name));

      const CHUNK_SIZE = 2500;
      let lastId: string | null = null;
      let totalSyncedSoFar = 0;

      while (true) {
        const querySql = lastId
          ? `SELECT * FROM voters WHERE ac_id = $1::uuid AND id > $2::uuid ORDER BY id ASC LIMIT ${CHUNK_SIZE}`
          : `SELECT * FROM voters WHERE ac_id = $1::uuid ORDER BY id ASC LIMIT ${CHUNK_SIZE}`;
        const params = lastId ? [acId, lastId] : [acId];

        const chunkRes = await masterClient.query(querySql, params);
        const batch: Record<string, any>[] = chunkRes.rows;
        if (!batch || batch.length === 0) break;

        const tenantClient = await tenantPool.connect();
        try {
          await tenantClient.query('SET statement_timeout = 300000');
          await tenantClient.query('BEGIN');

          const rawColumns = Object.keys(batch[0]);
          const columns = rawColumns.filter((c) => targetCols.has(c));
          const colNames = columns.map((c) => `"${c}"`).join(', ');

          // Non-identifying columns to update on conflict
          const updateAssigns = columns
            .filter((c) => !['id', 'epic_no', 'created_at'].includes(c))
            .map((c) => {
              // Preserve tenant-specific annotations if already set in tenant DB
              if (['caste_id', 'party_id', 'religion_id', 'mobile_no', 'booth_id'].includes(c)) {
                return `"${c}" = COALESCE(voters."${c}", EXCLUDED."${c}")`;
              }
              return `"${c}" = EXCLUDED."${c}"`;
            })
            .join(', ');

          const SUB_CHUNK = 500;
          for (let offset = 0; offset < batch.length; offset += SUB_CHUNK) {
            const subChunk = batch.slice(offset, offset + SUB_CHUNK);
            const values: any[] = [];
            const valueTuples: string[] = [];
            let paramIdx = 1;

            for (const v of subChunk) {
              const rowData: Record<string, any> = { ...v };
              const rowPlaceholders: string[] = [];
              for (const col of columns) {
                values.push(rowData[col] ?? null);
                rowPlaceholders.push(`$${paramIdx++}`);
              }
              valueTuples.push(`(${rowPlaceholders.join(', ')})`);
            }

            const multiRowSql = `
              INSERT INTO voters (${colNames})
              VALUES ${valueTuples.join(', ')}
              ON CONFLICT (epic_no) DO UPDATE SET
                ${updateAssigns},
                updated_at = NOW();
            `;
            await tenantClient.query(multiRowSql, values);
          }

          await tenantClient.query('COMMIT');
        } catch (subErr) {
          await tenantClient.query('ROLLBACK').catch(() => { });
          throw subErr;
        } finally {
          tenantClient.release();
        }

        totalSyncedSoFar += batch.length;
        lastId = batch[batch.length - 1].id;

        // Update progress in queue table every chunk
        await masterQuery(
          `UPDATE master_voter_sync_queue SET synced_voters = $1, updated_at = NOW() WHERE id = $2`,
          [totalSyncedSoFar, jobId]
        );
      }

      // 3. Rebuild secondary and GIN search indexes with high maintenance memory
      logger.info(`[MasterVoterSyncQueue] Rebuilding indexes on '${tenantDbName}' for ${totalSyncedSoFar} voters...`);
      await VoterProvisionService.buildSearchIndexes(tenantPool, tenantId, 95);

      // 4. Invalidate tenant caches
      await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName}:*`).catch(() => { });

      // 5. Mark job completed
      await masterQuery(
        `UPDATE master_voter_sync_queue
         SET status = 'completed',
             synced_voters = $1,
             completed_at = NOW(),
             last_error = NULL,
             updated_at = NOW()
         WHERE id = $2`,
        [totalSyncedSoFar, jobId]
      );
      logger.info(`[MasterVoterSyncQueue] 🎉 Job ${jobId} COMPLETED: ${totalSyncedSoFar} voters synced to '${tenantDbName}'`);
    } catch (err: any) {
      logger.error(`[MasterVoterSyncQueue] ❌ Job ${jobId} failed:`, err.message);
      await this.handleJobFailure(job, err);
    } finally {
      if (masterClient) {
        masterClient.release();
      }
    }
  }

  /**
   * Handles failure: applies exponential backoff for retries or transitions to 'failed'
   */
  private static async handleJobFailure(job: SyncQueueJob, err: Error): Promise<void> {
    const newRetryCount = job.retry_count + 1;
    const maxRetries = job.max_retries || 5;

    if (newRetryCount <= maxRetries) {
      const backoffMin = this.RETRY_BACKOFF_MINUTES[newRetryCount - 1] || 60;
      await masterQuery(
        `UPDATE master_voter_sync_queue
         SET status = 'retrying',
             retry_count = $1,
             last_error = $2,
             next_retry_at = NOW() + ($3 || ' minutes')::interval,
             updated_at = NOW()
         WHERE id = $4`,
        [newRetryCount, err.message, backoffMin, job.id]
      );
      logger.warn(
        `[MasterVoterSyncQueue] Job ${job.id} scheduled for retry #${newRetryCount} in ${backoffMin}m (at next_retry_at). Reason: ${err.message}`
      );
    } else {
      // Retries exhausted: mark as failed (dead-letter queue)
      await masterQuery(
        `UPDATE master_voter_sync_queue
         SET status = 'failed',
             retry_count = $1,
             last_error = $2,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [newRetryCount, `Exhausted ${maxRetries} retries. Final error: ${err.message}`, job.id]
      );
      logger.error(
        `[MasterVoterSyncQueue] Job ${job.id} PERMANENTLY FAILED after ${maxRetries} retries. Awaiting manual retry from SuperAdmin.`
      );
    }
  }

  /**
   * SuperAdmin manual retry for a specific job
   */
  static async retryJob(jobId: string): Promise<boolean> {
    const res = await masterQuery(
      `UPDATE master_voter_sync_queue
       SET status = 'pending',
           next_retry_at = NOW(),
           last_error = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [jobId]
    );

    if (res.rows.length > 0) {
      logger.info(`[MasterVoterSyncQueue] SuperAdmin manually re-triggered job ${jobId}`);
      this.triggerWorker();
      return true;
    }
    return false;
  }

  /**
   * SuperAdmin bulk retry for all failed jobs
   */
  static async retryAllFailed(): Promise<number> {
    const res = await masterQuery(
      `UPDATE master_voter_sync_queue
       SET status = 'pending',
           next_retry_at = NOW(),
           last_error = NULL,
           updated_at = NOW()
       WHERE status = 'failed'
       RETURNING id`
    );

    const count = res.rows.length;
    if (count > 0) {
      logger.info(`[MasterVoterSyncQueue] SuperAdmin manually re-triggered ${count} failed jobs.`);
      this.triggerWorker();
    }
    return count;
  }

  /**
   * Periodic retry poller: checks for eligible retrying jobs every 2 minutes
   */
  static async pollEligibleRetries(): Promise<number> {
    try {
      const res = await masterQuery(
        `SELECT COUNT(*)::int AS count
         FROM master_voter_sync_queue
         WHERE status = 'retrying' AND next_retry_at <= NOW()`
      );
      const count = Number(res.rows[0]?.count || 0);
      if (count > 0) {
        logger.info(`[MasterVoterSyncQueue] Found ${count} retry job(s) ready to process.`);
        console.log(`[MasterVoterSyncQueue] Triggering retry processing for ${count} job(s)...`);
        this.triggerWorker();
      }
      return count;
    } catch (err: any) {
      logger.error(`[MasterVoterSyncQueue] Error polling eligible retries:`, err);
      return 0;
    }
  }

  /**
   * Start background worker timer running voter sync retry checks every intervalMs (default: 120s)
   */
  static startBackgroundWorker(intervalMs = 120000): void {
    if (!this.retryIntervalTimer) {
      this.retryIntervalTimer = setInterval(() => {
        this.pollEligibleRetries().catch((err) => {
          logger.error('[MasterVoterSyncQueue] Error in background retry poller loop:', err);
        });
      }, intervalMs);
      this.retryIntervalTimer.unref();
      logger.info(`[MasterVoterSyncQueue] Voter sync queue retry poller started (interval: ${intervalMs}ms)`);
    }
  }

  /**
   * Stop background worker timer
   */
  static stopBackgroundWorker(): void {
    if (this.retryIntervalTimer) {
      clearInterval(this.retryIntervalTimer);
      this.retryIntervalTimer = null;
      logger.info('[MasterVoterSyncQueue] Voter sync queue retry poller stopped');
    }
  }

  /**
   * Retrieve list of queue jobs for SuperAdmin dashboard
   */
  static async getQueueJobs(options: {
    status?: string;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: any[]; total: number }> {
    const { status, tenantId, limit = 20, offset = 0 } = options;
    const conditions: string[] = [];
    const params: any[] = [];
    let p = 1;

    if (status) {
      conditions.push(`q.status = $${p++}`);
      params.push(status);
    }
    if (tenantId) {
      conditions.push(`q.tenant_id = $${p++}`);
      params.push(tenantId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM master_voter_sync_queue q ${whereClause}`;
    const countRes = await masterQuery(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    const dataSql = `
      SELECT 
        q.id,
        q.job_type,
        q.source,
        q.batch_id,
        q.ac_id,
        ac.name AS ac_name,
        ac.ac_number,
        q.tenant_id,
        t.name AS tenant_name,
        q.tenant_db_name,
        q.total_voters,
        q.synced_voters,
        q.status,
        q.retry_count,
        q.max_retries,
        q.last_error,
        q.next_retry_at,
        q.started_at,
        q.completed_at,
        q.created_at,
        q.updated_at
      FROM master_voter_sync_queue q
      LEFT JOIN assembly_constituencies ac ON ac.id = q.ac_id
      LEFT JOIN tenants t ON t.id = q.tenant_id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${p++} OFFSET $${p++};
    `;
    params.push(limit, offset);

    const dataRes = await masterQuery(dataSql, params);
    return {
      jobs: dataRes.rows || [],
      total,
    };
  }
}
