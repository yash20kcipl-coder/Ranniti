import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { PcProvisionService } from './pc.provision.service';
import { AcProvisionService } from './ac.provision.service';
import { TenantQueries } from '../../queries/tenant.queries';
import { sendProvisioningReadyEmail } from '../../utils/mailer';
import { WardProvisionService } from './ward.provision.service';
import { StateProvisionService } from './state.provision.service';
import { CasteProvisionService } from './caste.provision.service';
import { PartyProvisionService } from './party.provision.service';
import { BoothProvisionService } from './booth.provision.service';
import { VoterProvisionService } from './voter.provision.service';
import { TalukaProvisionService } from './taluka.provision.service';
import { resolveConstituencyScope } from '../helpers/scopeResolver';
import { VillageProvisionService } from './village.provision.service';
import { ReligionProvisionService } from './religion.provision.service';
import { DistrictProvisionService } from './district.provision.service';
import { TenantDbProvisioner, getTenantDbPool } from '../../utils/tenantDbProvisioner';

/**
 * Syncs all master lookup tables into a tenant pool in strict dependency order.
 * Delegates individual table syncing to dedicated table provision services.
 */
async function syncMasterLookupTables(
  tenantPool: Pool,
  userId: string,
  acIds: string[],
  progressBase: number,
  progressRange: number,
  shouldTruncate: boolean = true,
  pcIds: string[] = []
): Promise<void> {
  const { resolvedAcIds, resolvedPcIds } = await resolveConstituencyScope(acIds, pcIds);

  // Cleanly clear existing lookup data to prevent duplicate key conflicts (full provisioning only)
  if (shouldTruncate) {
    await tenantPool.query(`
      TRUNCATE TABLE booths, wards, villages, talukas, assembly_constituencies, parliamentary_constituencies, districts, states, castes, religions, parties CASCADE;
    `);
  }

  const tableSyncTasks: Array<{
    label: string;
    tableName: string;
    action: () => Promise<any>;
  }> = [];

  if (shouldTruncate) {
    tableSyncTasks.push(
      { label: 'Syncing States (1/11)', tableName: 'states', action: () => StateProvisionService.sync(tenantPool) },
      { label: 'Syncing Districts (2/11)', tableName: 'districts', action: () => DistrictProvisionService.sync(tenantPool) },
      { label: 'Syncing Talukas (3/11)', tableName: 'talukas', action: () => TalukaProvisionService.sync(tenantPool) },
      { label: 'Syncing Villages (4/11)', tableName: 'villages', action: () => VillageProvisionService.sync(tenantPool) },
      { label: 'Syncing Religions (5/11)', tableName: 'religions', action: () => ReligionProvisionService.sync(tenantPool) },
      { label: 'Syncing Castes (6/11)', tableName: 'castes', action: () => CasteProvisionService.sync(tenantPool) },
      { label: 'Syncing Parties (7/11)', tableName: 'parties', action: () => PartyProvisionService.sync(tenantPool) }
    );
  }

  tableSyncTasks.push(
    { label: 'Syncing Parliamentary Constituencies (8/11)', tableName: 'parliamentary_constituencies', action: () => PcProvisionService.sync(tenantPool, resolvedPcIds) },
    { label: 'Syncing Assembly Constituencies (9/11)', tableName: 'assembly_constituencies', action: () => AcProvisionService.sync(tenantPool, resolvedAcIds) },
    { label: 'Syncing Wards (10/11)', tableName: 'wards', action: () => WardProvisionService.sync(tenantPool, resolvedAcIds) },
    { label: 'Syncing Polling Booths (11/11)', tableName: 'booths', action: () => BoothProvisionService.sync(tenantPool, resolvedAcIds) }
  );

  for (let i = 0; i < tableSyncTasks.length; i++) {
    const task = tableSyncTasks[i];
    const pct = progressBase + Math.round((i / tableSyncTasks.length) * progressRange);

    await TenantQueries.updateProvisioningStatus(userId, {
      status: 'provisioning',
      provisioningProgress: pct,
      currentStep: task.label,
      currentPhase: 'master_data',
      activeTable: task.tableName,
    });

    const res = await task.action();
    if (res?.count !== undefined) {
      await TenantQueries.updateProvisioningStatus(userId, {
        status: 'provisioning',
        processedRecords: res.count,
      });
    }
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

  // Ensure default wards exist and booths are linked to wards
  await WardProvisionService.ensureDefaultWards(tenantPool);
  await BoothProvisionService.repairWardAssignments(tenantPool);
}

// ---------------------------------------------------------------------------
// Main Tenant Provisioning Orchestration Service
// ---------------------------------------------------------------------------
export class TenantProvisioningService {
  /**
   * Full provisioning: creates DB, runs schema, syncs all master data + voters.
   * Optimizations: Reuses single connection pool, defers GIN indexes, relaxes timeouts.
   */
  async provisionTenantDataAsync(
    tenantId: string,
    tenantDbName: string,
    acIds: string[],
    pcIds: string[]
  ): Promise<void> {
    logger.info(`[TenantProvisioningService] Starting full provisioning for tenant '${tenantId}' [DB: ${tenantDbName}]`);

    try {
      // Step 1 — Create DB (0–10%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 5,
        currentStep: 'Creating Tenant Database',
        currentPhase: 'db_init',
        activeTable: null,
      });

      await TenantDbProvisioner.createTenantDatabase(tenantDbName);

      // Open a single tenant DB pool reused for all subsequent provisioning phases
      const tenantPool = getTenantDbPool(tenantDbName);

      try {
        // Step 2 — Initialize schema (10–25%)
        await TenantQueries.updateProvisioningStatus(tenantId, {
          status: 'provisioning',
          provisioningProgress: 15,
          currentStep: 'Initializing Database Schema',
          currentPhase: 'schema',
          activeTable: null,
        });

        await TenantDbProvisioner.initializeTenantSchemaWithPool(tenantPool, tenantDbName);

        // Step 3 — Sync all master lookup tables (25–50%)
        await syncMasterLookupTables(tenantPool, tenantId, acIds, 25, 25, true, pcIds);

        // Step 4 — Bulk copy voters without GIN index overhead (50–90%)
        await TenantQueries.updateProvisioningStatus(tenantId, {
          status: 'provisioning',
          provisioningProgress: 50,
          currentStep: 'Loading Voters from Master DB',
          currentPhase: 'voters',
          activeTable: 'voters',
        });

        const { resolvedAcIds } = await resolveConstituencyScope(acIds, pcIds);

        let copiedVotersCount = 0;
        if (resolvedAcIds.length > 0) {
          copiedVotersCount = await VoterProvisionService.copyVotersInChunks(
            tenantPool,
            tenantId,
            resolvedAcIds,
            50,
            40,
            true
          );
        }

        // Step 5 — Build GIN Trigram Search Indexes in post-import pass (90–98%)
        await VoterProvisionService.buildSearchIndexes(tenantPool, tenantId, 95);

        // Step 6 — Mark complete (100%)
        await TenantQueries.updateProvisioningStatus(tenantId, {
          status: 'active',
          provisioningProgress: 100,
          totalVotersCopied: copiedVotersCount,
          currentStep: 'Provisioning Complete',
          currentPhase: 'completed',
          activeTable: null,
          processedRecords: copiedVotersCount,
          totalRecords: copiedVotersCount,
        });

        logger.info(`[TenantProvisioningService] ✅ Provisioning complete for tenant '${tenantId}'. Copied ${copiedVotersCount} voters to '${tenantDbName}'.`);

        // Step 7 — Send welcome email (non-blocking)
        const tenant = await TenantQueries.getById(tenantId);
        if (tenant) {
          sendProvisioningReadyEmail(tenant.email, tenant.name, {
            acCount: resolvedAcIds.length,
            voterCount: copiedVotersCount,
          }).catch((err) => logger.error('[TenantProvisioning] Email notification error:', err));
        }
      } finally {
        await tenantPool.end();
      }
    } catch (err: any) {
      logger.error(`[TenantProvisioningService] ❌ Provisioning failed for tenant '${tenantId}':`, err);
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'failed',
        currentStep: 'Provisioning Failed',
        currentPhase: 'failed',
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

    const tenantPool = getTenantDbPool(tenantDbName);

    try {
      // Step 0 — Ensure tenant DB schema has all migrations applied
      await TenantDbProvisioner.initializeTenantSchemaWithPool(tenantPool, tenantDbName);

      // Step 1 — Sync master lookup tables + new ACs + booths (0–40%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 5,
        currentStep: 'Preparing Master Data Sync',
        currentPhase: 'master_data',
        activeTable: null,
      });

      await syncMasterLookupTables(tenantPool, tenantId, newAcIds, 5, 35, false, pcIds);

      // Step 2 — Copy voters for new ACs only (40–90%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'provisioning',
        provisioningProgress: 40,
        currentStep: 'Loading New Voters from Master DB',
        currentPhase: 'voters',
        activeTable: 'voters',
      });

      let copiedCount = 0;
      if (newAcIds.length > 0) {
        copiedCount = await VoterProvisionService.copyVotersInChunks(
          tenantPool,
          tenantId,
          newAcIds,
          40,
          50,
          false
        );
      }

      // Step 3 — Build search indexes for added voters (90–98%)
      await VoterProvisionService.buildSearchIndexes(tenantPool, tenantId, 95);

      // Get updated total count from tenant DB
      let totalInDb = copiedCount;
      const countRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM voters`);
      totalInDb = countRes.rows[0]?.total || copiedCount;

      // Step 4 — Done (100%)
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'active',
        provisioningProgress: 100,
        totalVotersCopied: totalInDb,
        currentStep: 'Sync Complete',
        currentPhase: 'completed',
        activeTable: null,
        processedRecords: totalInDb,
        totalRecords: totalInDb,
      });

      logger.info(`[TenantProvisioningService] ✅ Incremental sync complete for '${tenantDbName}'. Copied ${copiedCount} new voters (total in DB: ${totalInDb}).`);
    } catch (err: any) {
      logger.error(`[TenantProvisioningService] ❌ Incremental sync failed for '${tenantDbName}':`, err);
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'failed',
        currentStep: 'Incremental Sync Failed',
        currentPhase: 'failed',
        errorMessage: err.message || 'Incremental sync failed unexpectedly',
      });
    } finally {
      await tenantPool.end();
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
      currentPhase: 'master_data',
      activeTable: 'voters',
    });

    const tenantPool = getTenantDbPool(tenantDbName);
    try {
      // 1. Delete voters scoped to removed ACs
      const voterDel = await VoterProvisionService.removeVoters(tenantPool, removedAcIds);
      logger.info(`[TenantProvisioningService] Removed ${voterDel.deleted} voters for de-scoped ACs.`);

      // 2. Delete booths scoped to removed ACs
      const boothDel = await BoothProvisionService.removeBoothRecords(tenantPool, removedAcIds);
      logger.info(`[TenantProvisioningService] Removed ${boothDel.deleted} booths for de-scoped ACs.`);

      // 3. Delete wards scoped to removed ACs
      const wardDel = await WardProvisionService.removeWardRecords(tenantPool, removedAcIds);
      logger.info(`[TenantProvisioningService] Removed ${wardDel.deleted} wards for de-scoped ACs.`);

      // 4. Delete the AC records
      const acDel = await AcProvisionService.removeAcRecords(tenantPool, removedAcIds);
      logger.info(`[TenantProvisioningService] Removed ${acDel.deleted} AC records.`);

      // 5. Clean up orphaned PCs
      const pcDel = await PcProvisionService.pruneOrphaned(tenantPool);
      logger.info(`[TenantProvisioningService] Pruned ${pcDel.deleted} orphaned PC records.`);

      // 6. Get updated voter count remaining in tenant DB
      const countRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM voters`);
      const remainingVoters: number = countRes.rows[0]?.total || 0;

      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'active',
        provisioningProgress: 100,
        totalVotersCopied: remainingVoters,
        currentStep: 'Sync Complete',
        currentPhase: 'completed',
        activeTable: null,
        processedRecords: remainingVoters,
        totalRecords: remainingVoters,
      });

      logger.info(`[TenantProvisioningService] ✅ AC purge complete for '${tenantDbName}'. ${remainingVoters} voters remain.`);
    } catch (err: any) {
      logger.error(`[TenantProvisioningService] ❌ AC purge failed for '${tenantDbName}':`, err);
      await TenantQueries.updateProvisioningStatus(tenantId, {
        status: 'active',
        currentStep: '',
        errorMessage: `AC removal failed: ${err.message}`,
      });
    } finally {
      await tenantPool.end();
    }
  }
}

export const tenantProvisioningService = new TenantProvisioningService();
