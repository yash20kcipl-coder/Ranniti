import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { query as masterQuery, dbPool } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { resolveConstituencyScope } from '../helpers/scopeResolver';

export interface VoterCopyProgressCallback {
  (
    copiedCount: number,
    totalVoters: number,
    progressPct: number,
    currentStep: string,
    currentPhase: string,
    activeTable: string
  ): void;
}

export class VoterProvisionService {
  static readonly TABLE_NAME = 'voters';

  /**
   * Temporarily drops heavy GIN trigram indexes prior to bulk ingestion to achieve
   * maximum insertion throughput (prevents 10x-15x write degradation).
   */
  static async dropSearchIndexes(tenantPool: Pool): Promise<void> {
    try {
      await tenantPool.query(`
        DROP INDEX IF EXISTS idx_voters_eng_fname_trgm;
        DROP INDEX IF EXISTS idx_voters_eng_sname_trgm;
        DROP INDEX IF EXISTS idx_voters_epic_no_trgm;
        DROP INDEX IF EXISTS idx_voters_mobile_no_trgm;
        DROP INDEX IF EXISTS idx_voters_house_no_trgm;
        DROP INDEX IF EXISTS idx_voters_first_name_trgm;
        DROP INDEX IF EXISTS idx_voters_surname_trgm;
      `);
      logger.info('[VoterProvisionService] Dropped GIN indexes for fast bulk ingestion.');
    } catch (err: any) {
      logger.warn('[VoterProvisionService] Error dropping GIN indexes (non-fatal):', err.message);
    }
  }

  /**
   * Recreates all GIN trigram indexes post-import using elevated maintenance memory,
   * followed by an ANALYZE pass to ensure optimal query execution plans.
   */
  static async buildSearchIndexes(
    tenantPool: Pool,
    tenantId: string,
    progressPct: number = 95,
    onProgress?: VoterCopyProgressCallback
  ): Promise<void> {
    logger.info('[VoterProvisionService] Building GIN search indexes with maintenance memory...');
    const stepText = 'Building Fast Search & Trigram Indexes';

    if (onProgress) {
      onProgress(0, 0, progressPct, stepText, 'indexing', 'voters');
    } else {
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: progressPct,
        currentStep: stepText,
        currentPhase: 'indexing',
        activeTable: 'voters',
      });
    }

    const client = await tenantPool.connect();
    try {
      await client.query(`SET maintenance_work_mem = '64MB';`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_voters_eng_fname_trgm ON voters USING gin(eng_first_name gin_trgm_ops);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_voters_eng_sname_trgm ON voters USING gin(eng_surname gin_trgm_ops);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_voters_epic_no_trgm ON voters USING gin(epic_no gin_trgm_ops);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_voters_mobile_no_trgm ON voters USING gin(mobile_no gin_trgm_ops);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_voters_house_no_trgm ON voters USING gin(house_no gin_trgm_ops);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_voters_first_name_trgm ON voters USING gin(first_name gin_trgm_ops);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_voters_surname_trgm ON voters USING gin(surname gin_trgm_ops);`);
      await client.query(`ANALYZE voters;`);
      logger.info('[VoterProvisionService] Successfully built all search indexes & analyzed voters table.');
    } finally {
      client.release();
    }
  }

  /**
   * Bulk copies voters from master DB into the tenant DB in 2 passes:
   * Pass 1: Chunked INSERT with self-referential foreign keys (influencer IDs) nulled out.
   * Pass 2: Chunked UPDATE restoring influencer links after all voter IDs exist in the tenant DB.
   */
  static async copyVotersInChunks(
    tenantPool: Pool,
    tenantId: string,
    acIds: string[],
    progressBase: number,
    progressRange: number,
    shouldTruncate = true,
    onProgress?: VoterCopyProgressCallback
  ): Promise<number> {
    if (!acIds || acIds.length === 0) return 0;

    // Clear existing voters in tenant pool if full provisioning
    if (shouldTruncate) {
      await tenantPool.query(`TRUNCATE TABLE voters CASCADE;`);
    }

    // Drop GIN indexes before bulk copying to maximize throughput
    await this.dropSearchIndexes(tenantPool);

    // Fetch valid column names in the tenant's voters table to prevent column mismatch errors
    const targetColsRes = await tenantPool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'voters'`
    );
    const targetCols = new Set(targetColsRes.rows.map((r: any) => r.column_name));

    // Connect to master with relaxed statement timeout to prevent 15s timeout aborts on large ACs
    const masterClient = await dbPool.connect();
    let totalVoters = 0;

    try {
      await masterClient.query('SET statement_timeout = 180000'); // 3 minutes timeout for bulk operations

      const countRes = await masterClient.query(
        `SELECT COUNT(*)::int AS total FROM voters WHERE ac_id = ANY($1::uuid[])`,
        [acIds]
      );
      totalVoters = countRes.rows[0]?.total || 0;
      logger.info(`[VoterProvisionService] Found ${totalVoters} voters to copy to tenant DB.`);
      if (totalVoters === 0) return 0;

      let copiedCount = 0;
      const CHUNK_SIZE = 5000;
      let lastId: string | null = null;

      // ── Pass 1: Multi-row chunked INSERT (indexed keyset pagination) ────────
      while (true) {
        const querySql: string = lastId
          ? `SELECT * FROM voters WHERE ac_id = ANY($1::uuid[]) AND id > $2::uuid ORDER BY id ASC LIMIT ${CHUNK_SIZE}`
          : `SELECT * FROM voters WHERE ac_id = ANY($1::uuid[]) ORDER BY id ASC LIMIT ${CHUNK_SIZE}`;
        const params: any[] = lastId ? [acIds, lastId] : [acIds];
        const chunkRes = await masterClient.query(querySql, params);
        const batch: Record<string, any>[] = chunkRes.rows;
        if (!batch || batch.length === 0) break;

        const client = await tenantPool.connect();
        try {
          await client.query('BEGIN');

          const rawColumns = Object.keys(batch[0]);
          const columns = rawColumns.filter((c) => targetCols.has(c));
          const colNames = columns.map((c) => `"${c}"`).join(', ');

          const SUB_CHUNK = 500;
          for (let offset = 0; offset < batch.length; offset += SUB_CHUNK) {
            const subChunk = batch.slice(offset, offset + SUB_CHUNK);
            const values: any[] = [];
            const valueTuples: string[] = [];
            let paramIdx = 1;

            for (const v of subChunk) {
              const rowData: Record<string, any> = { ...v, family_influencer_id: null, social_influencer_id: null };
              const rowPlaceholders: string[] = [];
              for (const col of columns) {
                values.push(rowData[col] ?? null);
                rowPlaceholders.push(`$${paramIdx++}`);
              }
              valueTuples.push(`(${rowPlaceholders.join(', ')})`);
            }

            const multiRowSql = `INSERT INTO voters (${colNames}) VALUES ${valueTuples.join(', ')} ON CONFLICT (epic_no) DO NOTHING`;
            await client.query(multiRowSql, values);
          }

          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }

        copiedCount += batch.length;
        lastId = batch[batch.length - 1].id;

        const insertProgressRange = Math.round(progressRange * 0.85);
        const pct = Math.min(
          progressBase + insertProgressRange,
          progressBase + Math.round((copiedCount / totalVoters) * insertProgressRange)
        );
        const stepText = `Copying Voters (${copiedCount.toLocaleString()} / ${totalVoters.toLocaleString()})`;

        if (onProgress) {
          onProgress(copiedCount, totalVoters, pct, stepText, 'voters', 'voters');
        } else {
          TenantQueries.updateProvisioningStatus(tenantId, {
            status: 'provisioning',
            provisioningProgress: pct,
            totalVotersCopied: copiedCount,
            currentStep: stepText,
            currentPhase: 'voters',
            activeTable: 'voters',
            processedRecords: copiedCount,
            totalRecords: totalVoters,
          }).catch((e) => logger.error('[VoterProvisionService] Progress update error:', e));
        }

        if (batch.length < CHUNK_SIZE) break;
      }

      // ── Pass 2: Restore self-referential influencer links safely ───────────
      logger.info(`[VoterProvisionService] Restoring influencer links for ${totalVoters} voters...`);
      const infPct = progressBase + Math.round(progressRange * 0.88);
      const infStepText = 'Restoring Influencer Links & Relations';

      if (onProgress) {
        onProgress(copiedCount, totalVoters, infPct, infStepText, 'influencers', 'voters');
      } else {
        TenantQueries.updateProvisioningStatus(tenantId, {
          status: 'provisioning',
          provisioningProgress: infPct,
          currentStep: infStepText,
          currentPhase: 'influencers',
          activeTable: 'voters',
          processedRecords: copiedCount,
          totalRecords: totalVoters,
        }).catch((e) => logger.error('[VoterProvisionService] Progress update error:', e));
      }

      let lastInfId: string | null = null;
      const INF_CHUNK_SIZE = 2500;

      while (true) {
        const infQuery: string = lastInfId
          ? `SELECT id, epic_no, family_influencer_id, social_influencer_id 
             FROM voters 
             WHERE ac_id = ANY($1::uuid[]) 
               AND (family_influencer_id IS NOT NULL OR social_influencer_id IS NOT NULL) 
               AND id > $2::uuid 
             ORDER BY id ASC 
             LIMIT ${INF_CHUNK_SIZE}`
          : `SELECT id, epic_no, family_influencer_id, social_influencer_id 
             FROM voters 
             WHERE ac_id = ANY($1::uuid[]) 
               AND (family_influencer_id IS NOT NULL OR social_influencer_id IS NOT NULL) 
             ORDER BY id ASC 
             LIMIT ${INF_CHUNK_SIZE}`;

        const infParams: any[] = lastInfId ? [acIds, lastInfId] : [acIds];
        const infRes = await masterClient.query(infQuery, infParams);
        const infBatch: Record<string, any>[] = infRes.rows;
        if (!infBatch || infBatch.length === 0) break;

        const SUB_INF = 250;
        const client = await tenantPool.connect();
        try {
          await client.query('BEGIN');
          for (let offset = 0; offset < infBatch.length; offset += SUB_INF) {
            const subInf = infBatch.slice(offset, offset + SUB_INF);
            const valueTuples: string[] = [];
            const params: any[] = [];
            let p = 1;
            for (const iv of subInf) {
              valueTuples.push(`($${p++}, $${p++}::uuid, $${p++}::uuid)`);
              params.push(iv.epic_no, iv.family_influencer_id || null, iv.social_influencer_id || null);
            }

            await client.query(
              `UPDATE voters AS v
               SET family_influencer_id = CASE
                     WHEN f.id IS NOT NULL THEN vals.fam_id
                     ELSE NULL
                   END,
                   social_influencer_id = CASE
                     WHEN s.id IS NOT NULL THEN vals.soc_id
                     ELSE NULL
                   END
               FROM (VALUES ${valueTuples.join(', ')}) AS vals(epic_no, fam_id, soc_id)
               LEFT JOIN voters f ON f.id = vals.fam_id
               LEFT JOIN voters s ON s.id = vals.soc_id
               WHERE v.epic_no = vals.epic_no
                 AND (
                   (vals.fam_id IS NOT NULL AND f.id IS NOT NULL)
                   OR
                   (vals.soc_id IS NOT NULL AND s.id IS NOT NULL)
                 )`,
              params
            );
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }

        lastInfId = infBatch[infBatch.length - 1].id;
        if (infBatch.length < INF_CHUNK_SIZE) break;
      }

      logger.info(`[VoterProvisionService] Finished restoring influencer links.`);
      return copiedCount;
    } finally {
      await masterClient.query('RESET statement_timeout').catch(() => {});
      masterClient.release();
    }
  }

  /**
   * Delete voters scoped to removed/de-scoped AC IDs.
   */
  static async removeVoters(tenantPool: Pool, removedAcIds: string[]): Promise<{ deleted: number }> {
    if (!removedAcIds.length) return { deleted: 0 };
    const res = await tenantPool.query(
      `DELETE FROM voters WHERE ac_id = ANY($1::uuid[])`,
      [removedAcIds]
    );
    return { deleted: res.rowCount || 0 };
  }

  /**
   * Standalone sync for a given tenant ID based on assigned AC scope.
   */
  static async syncForTenant(tenantId: string, shouldTruncate = false): Promise<{ count: number }> {
    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);

    const { resolvedAcIds } = await resolveConstituencyScope(tenant.acIds || [], tenant.pcIds || []);
    const pool = getTenantDbPool(tenant.tenantDbName);
    try {
      const count = await this.copyVotersInChunks(pool, tenantId, resolvedAcIds, 0, 95, shouldTruncate);
      await this.buildSearchIndexes(pool, tenantId, 100);
      return { count };
    } finally {
      await pool.end().catch(() => {});
    }
  }

  /**
   * Compare master vs tenant count for the tenant's scoped voters.
   */
  static async getStats(tenantPool: Pool, acIds: string[] = []): Promise<{ masterCount: number; tenantCount: number; diff: number; synced: boolean }> {
    let masterCount = 0;
    if (acIds.length > 0) {
      const mRes = await masterQuery(
        `SELECT COUNT(*)::int AS total FROM voters WHERE ac_id = ANY($1::uuid[])`,
        [acIds]
      );
      masterCount = mRes.rows[0]?.total || 0;
    }

    const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM voters`);
    const tenantCount = tRes.rows[0]?.total || 0;
    const diff = masterCount - tenantCount;

    return {
      masterCount,
      tenantCount,
      diff,
      synced: diff === 0,
    };
  }
}
