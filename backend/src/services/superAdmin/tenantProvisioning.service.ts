import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { sendProvisioningReadyEmail } from '../../utils/mailer';
import { BulkImporter, BulkImportProgress } from '../../utils/bulkImporter';
import { TenantDbProvisioner, getTenantDbPool } from '../../utils/tenantDbProvisioner';

// ---------------------------------------------------------------------------
// Shared bulk-insert helper
// Builds a single multi-row VALUES statement to replace N sequential inserts.
// Chunk size kept at 500 rows to stay safely below pg's 65535 param limit.
// ---------------------------------------------------------------------------
async function bulkUpsert(
  pool: Pool,
  tableName: string,
  columns: string[],
  rows: Record<string, any>[],
  conflictKey = 'id'
): Promise<void> {
  if (!rows.length) return;

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const colNames = columns.map((c) => `"${c}"`).join(', ');
    const valueTuples: string[] = [];
    const params: any[] = [];
    let p = 1;

    for (const row of chunk) {
      const placeholders = columns.map(() => `$${p++}`).join(', ');
      valueTuples.push(`(${placeholders})`);
      for (const col of columns) params.push(row[col] ?? null);
    }

    const updateCols = columns
      .filter((c) => c !== conflictKey && c !== 'created_at')
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(', ');

    const conflictClause = updateCols
      ? `ON CONFLICT (${conflictKey}) DO UPDATE SET ${updateCols}`
      : `ON CONFLICT (${conflictKey}) DO NOTHING`;

    await pool.query(
      `INSERT INTO ${tableName} (${colNames}) VALUES ${valueTuples.join(', ')} ${conflictClause}`,
      params
    );
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Syncs all master lookup tables into a tenant pool (idempotent bulk upsert)
// PCs, ACs, Wards, Booths: ONLY assigned to tenant
// Other master tables (states, districts, talukas, villages, religions, castes, parties): COPY ALL
// ---------------------------------------------------------------------------
async function syncMasterLookupTables(
  tenantPool: Pool,
  userId: string,
  acIds: string[],
  progressBase: number,
  progressRange: number,
  shouldTruncate: boolean = true,
  pcIds: string[] = []
): Promise<void> {
  // Resolve assigned scope:
  // 1. Resolve PC IDs (from directly assigned pcIds + parent PCs of acIds)
  const pcIdSet = new Set<string>((pcIds || []).filter(Boolean));
  if (acIds && acIds.length > 0) {
    const parentPcRes = await masterQuery(
      `SELECT DISTINCT pc_id FROM assembly_constituencies WHERE id = ANY($1::uuid[]) AND pc_id IS NOT NULL`,
      [acIds]
    );
    for (const r of parentPcRes.rows) {
      if (r.pc_id) pcIdSet.add(r.pc_id);
    }
  }
  const resolvedPcIds = Array.from(pcIdSet);

  // 2. Resolve AC IDs (from directly assigned acIds + child ACs of pcIds)
  const acIdSet = new Set<string>((acIds || []).filter(Boolean));
  if (pcIds && pcIds.length > 0) {
    const childAcRes = await masterQuery(
      `SELECT id FROM assembly_constituencies WHERE pc_id = ANY($1::uuid[])`,
      [pcIds]
    );
    for (const r of childAcRes.rows) {
      if (r.id) acIdSet.add(r.id);
    }
  }
  const resolvedAcIds = Array.from(acIdSet);

  // Cleanly clear existing lookup data to prevent duplicate key constraint conflicts when master IDs change (full provisioning only)
  if (shouldTruncate) {
    await tenantPool.query(`
      TRUNCATE TABLE booths, wards, villages, talukas, assembly_constituencies, parliamentary_constituencies, districts, states, castes, religions, parties CASCADE;
    `);
  }

  const fullProvisioningSteps = [
    {
      label: 'Syncing States',
      table: 'states',
      cols: ['id', 'name', 'created_at', 'updated_at'],
      fetch: async () => (await masterQuery(`SELECT id, name, created_at, updated_at FROM states`)).rows,
    },
    {
      label: 'Syncing Districts',
      table: 'districts',
      cols: ['id', 'state_id', 'name', 'created_at', 'updated_at'],
      fetch: async () => (await masterQuery(`SELECT id, state_id, name, created_at, updated_at FROM districts`)).rows,
    },
    {
      label: 'Syncing Talukas',
      table: 'talukas',
      cols: ['id', 'district_id', 'name', 'created_at', 'updated_at'],
      fetch: async () => (await masterQuery(`SELECT id, district_id, name, created_at, updated_at FROM talukas`)).rows,
    },
    {
      label: 'Syncing Villages',
      table: 'villages',
      cols: ['id', 'taluka_id', 'name', 'created_at', 'updated_at'],
      fetch: async () => (await masterQuery(`SELECT id, taluka_id, name, created_at, updated_at FROM villages`)).rows,
    },
    {
      label: 'Syncing Religions',
      table: 'religions',
      cols: ['id', 'name', 'created_at', 'updated_at'],
      fetch: async () => (await masterQuery(`SELECT id, name, created_at, updated_at FROM religions`)).rows,
    },
    {
      label: 'Syncing Castes',
      table: 'castes',
      cols: ['id', 'name', 'category', 'religion_id', 'parent_caste_id', 'created_at', 'updated_at'],
      fetch: async () => (await masterQuery(`SELECT id, name, category, religion_id, parent_caste_id, created_at, updated_at FROM castes`)).rows,
    },
    {
      label: 'Syncing Parties',
      table: 'parties',
      cols: ['id', 'name', 'abbreviation', 'symbol_logo', 'created_at', 'updated_at'],
      fetch: async () => (await masterQuery(`SELECT id, name, abbreviation, symbol_logo, created_at, updated_at FROM parties`)).rows,
    },
    {
      label: 'Syncing Parliamentary Constituencies',
      table: 'parliamentary_constituencies',
      cols: ['id', 'state_id', 'pc_number', 'name', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedPcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, state_id, pc_number, name, created_at, updated_at FROM parliamentary_constituencies WHERE id = ANY($1::uuid[])`,
                [resolvedPcIds]
              )
            ).rows
          : [],
    },
    {
      label: 'Syncing Assembly Constituencies',
      table: 'assembly_constituencies',
      cols: ['id', 'pc_id', 'district_id', 'ac_number', 'name', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedAcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, pc_id, district_id, ac_number, name, created_at, updated_at FROM assembly_constituencies WHERE id = ANY($1::uuid[])`,
                [resolvedAcIds]
              )
            ).rows
          : [],
    },
    {
      label: 'Syncing Wards',
      table: 'wards',
      cols: ['id', 'ac_id', 'ward_number', 'name', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedAcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, ac_id, ward_number, name, created_at, updated_at FROM wards WHERE ac_id = ANY($1::uuid[])`,
                [resolvedAcIds]
              )
            ).rows
          : [],
    },
    {
      label: 'Syncing Polling Booths',
      table: 'booths',
      cols: ['id', 'ac_id', 'ward_id', 'village_id', 'booth_number', 'name', 'location_building', 'total_voters', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedAcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, ac_id, ward_id, village_id, booth_number, name, location_building, total_voters, created_at, updated_at FROM booths WHERE ac_id = ANY($1::uuid[])`,
                [resolvedAcIds]
              )
            ).rows
          : [],
    },
  ];

  const incrementalSteps = [
    {
      label: 'Syncing Parliamentary Constituencies',
      table: 'parliamentary_constituencies',
      cols: ['id', 'state_id', 'pc_number', 'name', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedPcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, state_id, pc_number, name, created_at, updated_at FROM parliamentary_constituencies WHERE id = ANY($1::uuid[])`,
                [resolvedPcIds]
              )
            ).rows
          : [],
    },
    {
      label: 'Syncing Assembly Constituencies',
      table: 'assembly_constituencies',
      cols: ['id', 'pc_id', 'district_id', 'ac_number', 'name', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedAcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, pc_id, district_id, ac_number, name, created_at, updated_at FROM assembly_constituencies WHERE id = ANY($1::uuid[])`,
                [resolvedAcIds]
              )
            ).rows
          : [],
    },
    {
      label: 'Syncing Wards',
      table: 'wards',
      cols: ['id', 'ac_id', 'ward_number', 'name', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedAcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, ac_id, ward_number, name, created_at, updated_at FROM wards WHERE ac_id = ANY($1::uuid[])`,
                [resolvedAcIds]
              )
            ).rows
          : [],
    },
    {
      label: 'Syncing Polling Booths',
      table: 'booths',
      cols: ['id', 'ac_id', 'ward_id', 'village_id', 'booth_number', 'name', 'location_building', 'total_voters', 'created_at', 'updated_at'],
      fetch: async () =>
        resolvedAcIds.length > 0
          ? (
              await masterQuery(
                `SELECT id, ac_id, ward_id, village_id, booth_number, name, location_building, total_voters, created_at, updated_at FROM booths WHERE ac_id = ANY($1::uuid[])`,
                [resolvedAcIds]
              )
            ).rows
          : [],
    },
  ];

  const steps = shouldTruncate ? fullProvisioningSteps : incrementalSteps;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const pct = progressBase + Math.round((i / steps.length) * progressRange);

    await TenantQueries.updateProvisioningStatus(userId, {
      status: 'provisioning',
      provisioningProgress: pct,
      currentStep: step.label,
    });

    logger.info(`[TenantProvisioningService] ${step.label}...`);
    const rows = await step.fetch();
    await bulkUpsert(tenantPool, step.table, step.cols, rows);
    logger.info(`[TenantProvisioningService] ${step.label} — ${rows.length} rows synced.`);
  }

  // Prune out-of-scope legacy booths, wards, ACs, and PCs from previous runs (full provisioning only)
  if (shouldTruncate && resolvedAcIds.length > 0) {
    await tenantPool.query(`DELETE FROM booths WHERE NOT (ac_id = ANY($1::uuid[]))`, [resolvedAcIds]);
    await tenantPool.query(`DELETE FROM wards WHERE NOT (ac_id = ANY($1::uuid[]))`, [resolvedAcIds]);
    await tenantPool.query(`DELETE FROM assembly_constituencies WHERE NOT (id = ANY($1::uuid[]))`, [resolvedAcIds]);
    if (resolvedPcIds.length > 0) {
      await tenantPool.query(`DELETE FROM parliamentary_constituencies WHERE NOT (id = ANY($1::uuid[]))`, [resolvedPcIds]);
    }
  }

  // Ensure "There will be always ward for booth" in tenant database
  await tenantPool.query(`
    WITH missing_ac AS (
      SELECT DISTINCT b.ac_id, a.name AS ac_name
      FROM booths b
      JOIN assembly_constituencies a ON b.ac_id = a.id
      WHERE b.ward_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM wards w WHERE w.ac_id = b.ac_id)
    )
    INSERT INTO wards (ac_id, ward_number, name)
    SELECT ac_id, 1, 'Ward No. 1 (' || ac_name || ')'
    FROM missing_ac
    ON CONFLICT (ac_id, ward_number) DO NOTHING;
  `);

  await tenantPool.query(`
    UPDATE booths b
    SET ward_id = (SELECT w.id FROM wards w WHERE w.ac_id = b.ac_id ORDER BY w.ward_number ASC LIMIT 1)
    WHERE b.ward_id IS NULL;
  `);
}

// ---------------------------------------------------------------------------
// Shared voter bulk-copy logic (2-pass: insert without FKs, then restore links)
// ---------------------------------------------------------------------------
async function copyVotersToBatch(
  copyPool: Pool,
  rows: Record<string, any>[],
  userId: string,
  totalVoters: number,
  progressBase: number,
  progressRange: number,
  shouldTruncate = true
): Promise<number> {
  if (!rows.length) return 0;

  // Clear existing voters in tenant pool to ensure clean sync (only for full provisioning)
  if (shouldTruncate) {
    await copyPool.query(`TRUNCATE TABLE voters CASCADE;`);
  }

  let copiedCount = 0;

  await BulkImporter.processArray(rows, {
    batchSize: 2500,
    concurrency: 4,
    onBatchInsert: async (batch: Record<string, any>[]) => {
      if (batch.length === 0) return 0;
      const client = await copyPool.connect();
      try {
        await client.query('BEGIN');

        const columns = Object.keys(batch[0]);
        const colNames = columns.map((c) => `"${c}"`).join(', ');

        // Pass 1: Multi-row chunked INSERT (up to 500 rows per chunk) with self-referential FKs nulled
        const CHUNK_SIZE = 500;
        for (let offset = 0; offset < batch.length; offset += CHUNK_SIZE) {
          const chunk = batch.slice(offset, offset + CHUNK_SIZE);
          const values: any[] = [];
          const valueTuples: string[] = [];
          let paramIdx = 1;

          for (const v of chunk) {
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

        // Pass 2: Restore self-referential influencer links safely for voters that have influencers
        const influencerVoters = batch.filter((v: Record<string, any>) => v.family_influencer_id || v.social_influencer_id);
        if (influencerVoters.length > 0) {
          const CHUNK_INF = 200;
          for (let i = 0; i < influencerVoters.length; i += CHUNK_INF) {
            const chunk = influencerVoters.slice(i, i + CHUNK_INF);
            const valueTuples: string[] = [];
            const params: any[] = [];
            let p = 1;
            for (const iv of chunk) {
              valueTuples.push(`($${p++}, $${p++}::uuid, $${p++}::uuid)`);
              params.push(iv.epic_no, iv.family_influencer_id || null, iv.social_influencer_id || null);
            }
            await client.query(
              `UPDATE voters AS v
               SET family_influencer_id = vals.fam_id,
                   social_influencer_id = vals.soc_id
               FROM (VALUES ${valueTuples.join(', ')}) AS vals(epic_no, fam_id, soc_id)
               WHERE v.epic_no = vals.epic_no`,
              params
            );
          }
        }

        await client.query('COMMIT');
        return batch.length;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    onProgress: (progress: BulkImportProgress) => {
      copiedCount = progress.inserted;
      const pct = Math.min(
        progressBase + progressRange,
        progressBase + Math.round((progress.inserted / totalVoters) * progressRange)
      );
      TenantQueries.updateProvisioningStatus(userId, {
        status: 'provisioning',
        provisioningProgress: pct,
        totalVotersCopied: copiedCount,
        currentStep: `Copying Voters (${copiedCount.toLocaleString()} / ${totalVoters.toLocaleString()})`,
      }).catch((e) => logger.error('[TenantProvisioning] Progress update error:', e));
    },
  });

  return copiedCount;
}


// ---------------------------------------------------------------------------
// Main Provisioning Service
// ---------------------------------------------------------------------------
export class TenantProvisioningService {
  /**
   * Full provisioning: creates DB, runs schema, syncs all master data + voters.
   * Used when a tenant account is first created.
   */
  async provisionTenantDataAsync(
    tenantId: string,
    tenantDbName: string,
    acIds: string[],
    pcIds: string[]
  ): Promise<void> {
    logger.info(`[TenantProvisioningService] Starting full provisioning for tenant '${tenantId}' [DB: ${tenantDbName}]`);

    try {
      // Step 1 — Create DB + initialize schema (0–25%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 5,
        currentStep: 'Creating Tenant Database',
      });

      await TenantDbProvisioner.createTenantDatabase(tenantDbName);

      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 15,
        currentStep: 'Initializing Schema',
      });

      await TenantDbProvisioner.initializeTenantSchema(tenantDbName);

      // Step 2 — Sync all master lookup tables (25–50%)
      const tenantPool = getTenantDbPool(tenantDbName);
      try {
        await syncMasterLookupTables(tenantPool, tenantId, acIds, 25, 25, true, pcIds);
      } finally {
        await tenantPool.end();
      }

      // Step 3 — Copy voters (50–95%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 50,
        currentStep: 'Loading Voters from Master DB',
      });

      // Resolve all assigned AC IDs (direct acIds + child ACs of pcIds)
      const acIdSet = new Set<string>((acIds || []).filter(Boolean));
      if (pcIds && pcIds.length > 0) {
        const childAcRes = await masterQuery(`SELECT id FROM assembly_constituencies WHERE pc_id = ANY($1::uuid[])`, [pcIds]);
        for (const r of childAcRes.rows) {
          if (r.id) acIdSet.add(r.id);
        }
      }
      const resolvedAcIds = Array.from(acIdSet);

      const votersRes = resolvedAcIds.length > 0
        ? await masterQuery(`SELECT * FROM voters WHERE ac_id = ANY($1::uuid[])`, [resolvedAcIds])
        : { rowCount: 0, rows: [] };
      const totalVoters = votersRes.rowCount || 0;
      logger.info(`[TenantProvisioningService] Found ${totalVoters} voters to copy to '${tenantDbName}'.`);

      let copiedVotersCount = 0;
      if (totalVoters > 0) {
        const copyPool = getTenantDbPool(tenantDbName);
        try {
          copiedVotersCount = await copyVotersToBatch(copyPool, votersRes.rows, tenantId, totalVoters, 50, 45);
        } finally {
          await copyPool.end();
        }
      }


      // Step 4 — Mark complete (100%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'active',
        provisioningProgress: 100,
        totalVotersCopied: copiedVotersCount,
        currentStep: 'Provisioning Complete',
      });

      logger.info(`[TenantProvisioningService] ✅ Provisioning complete for tenant '${tenantId}'. Copied ${copiedVotersCount} voters to '${tenantDbName}'.`);

      // Step 5 — Send welcome email (non-blocking)
      const tenant = await TenantQueries.getById(tenantId);
      if (tenant) {
        sendProvisioningReadyEmail(tenant.email, tenant.name, {
          acCount: resolvedAcIds.length,
          voterCount: copiedVotersCount,
        }).catch((err) => logger.error('[TenantProvisioning] Email notification error:', err));
      }
    } catch (err: any) {
      logger.error(`[TenantProvisioningService] ❌ Provisioning failed for tenant '${tenantId}':`, err);
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'failed',
        currentStep: '',
        errorMessage: err.message || 'Provisioning failed unexpectedly',
      });
    }
  }

  /**
   * Incremental sync: adds new ACs/booths/voters to an already-provisioned tenant DB.
   * Called when a super-admin adds new ACs to an existing tenant via the edit flow.
   */
  async syncNewAcVoters(
    tenantId: string,
    tenantDbName: string,
    newAcIds: string[],
    pcIds: string[]
  ): Promise<void> {
    logger.info(`[TenantProvisioningService] Starting incremental sync of ${newAcIds.length} new AC(s) for DB '${tenantDbName}'`);

    try {
      // Step 1 — Sync master lookup tables + new ACs + booths (0–40%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 5,
        currentStep: 'Preparing Master Data Sync',
      });

      const tenantPool = getTenantDbPool(tenantDbName);
      try {
        await syncMasterLookupTables(tenantPool, tenantId, newAcIds, 5, 35, false, pcIds);
      } finally {
        await tenantPool.end();
      }

      // Step 2 — Copy voters for new ACs only (40–95%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 40,
        currentStep: 'Loading New Voters from Master DB',
      });

      const votersRes = await masterQuery(`SELECT * FROM voters WHERE ac_id = ANY($1)`, [newAcIds]);
      const totalVoters = votersRes.rowCount || 0;
      logger.info(`[TenantProvisioningService] Found ${totalVoters} voters for new AC(s) to sync into '${tenantDbName}'.`);

      let copiedCount = 0;
      if (totalVoters > 0) {
        const copyPool = getTenantDbPool(tenantDbName);
        try {
          copiedCount = await copyVotersToBatch(copyPool, votersRes.rows, tenantId, totalVoters, 40, 55, false);
        } finally {
          await copyPool.end();
        }
      }


      // Get updated total count from tenant DB
      const countPool = getTenantDbPool(tenantDbName);
      let totalInDb = copiedCount;
      try {
        const countRes = await countPool.query(`SELECT COUNT(*)::int AS total FROM voters`);
        totalInDb = countRes.rows[0]?.total || copiedCount;
      } finally {
        await countPool.end();
      }

      // Step 3 — Done (100%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'active',
        provisioningProgress: 100,
        totalVotersCopied: totalInDb,
        currentStep: 'Sync Complete',
      });

      logger.info(`[TenantProvisioningService] ✅ Incremental sync complete for '${tenantDbName}'. Copied ${copiedCount} new voters (total in DB: ${totalInDb}).`);
    } catch (err: any) {
      logger.error(`[TenantProvisioningService] ❌ Incremental sync failed for '${tenantDbName}':`, err);
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'failed',
        currentStep: '',
        errorMessage: err.message || 'Incremental sync failed unexpectedly',
      });
    }
  }

  /**
   * Purges all voters, booths, and AC records from a tenant DB for de-scoped ACs.
   * Called when a super-admin removes ACs from an existing tenant assignment via edit.
   */
  async removeAcVoters(
    tenantId: string,
    tenantDbName: string,
    removedAcIds: string[]
  ): Promise<void> {
    logger.info(`[TenantProvisioningService] Purging data for ${removedAcIds.length} removed AC(s) from '${tenantDbName}'`);

    await TenantQueries.updateProvisioningStatus(tenantId, {
      status: 'provisioning',
      currentStep: `Removing ${removedAcIds.length} de-scoped AC(s)`,
    });

    const tenantPool = getTenantDbPool(tenantDbName);
    try {
      // Delete voters scoped to the removed ACs
      const voterDel = await tenantPool.query(
        `DELETE FROM voters WHERE ac_id = ANY($1::uuid[])`,
        [removedAcIds]
      );
      logger.info(`[TenantProvisioningService] Removed ${voterDel.rowCount} voters for de-scoped ACs.`);

      // Delete booths scoped to the removed ACs
      const boothDel = await tenantPool.query(
        `DELETE FROM booths WHERE ac_id = ANY($1::uuid[])`,
        [removedAcIds]
      );
      logger.info(`[TenantProvisioningService] Removed ${boothDel.rowCount} booths for de-scoped ACs.`);

      // Delete wards scoped to the removed ACs
      const wardDel = await tenantPool.query(
        `DELETE FROM wards WHERE ac_id = ANY($1::uuid[])`,
        [removedAcIds]
      );
      logger.info(`[TenantProvisioningService] Removed ${wardDel.rowCount} wards for de-scoped ACs.`);

      // Delete the AC records themselves
      await tenantPool.query(
        `DELETE FROM assembly_constituencies WHERE id = ANY($1::uuid[])`,
        [removedAcIds]
      );

      // Clean up orphaned PCs that no longer have any remaining ACs in tenant DB
      await tenantPool.query(`
        DELETE FROM parliamentary_constituencies
        WHERE id NOT IN (SELECT DISTINCT pc_id FROM assembly_constituencies WHERE pc_id IS NOT NULL)
      `);

      // Get updated voter count remaining in tenant DB
      const countRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM voters`);
      const remainingVoters: number = countRes.rows[0]?.total || 0;

      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'active',
        provisioningProgress: 100,
        totalVotersCopied: remainingVoters,
        currentStep: 'Sync Complete',
      });

      logger.info(`[TenantProvisioningService] ✅ AC purge complete for '${tenantDbName}'. ${remainingVoters} voters remain.`);
    } catch (err: any) {
      logger.error(`[TenantProvisioningService] ❌ AC purge failed for '${tenantDbName}':`, err);
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'active', // keep active — don't break the tenant over a purge failure
        currentStep: '',
        errorMessage: `AC removal failed: ${err.message}`,
      });
    } finally {
      await tenantPool.end();
    }
  }
}

export const tenantProvisioningService = new TenantProvisioningService();
