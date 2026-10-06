import { logger } from '../../utils/logger';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantQueries } from '../../queries/tenant.queries';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';

// ─── Expected tenant DB tables (tables that must exist in every tenant DB) ────
const EXPECTED_TENANT_TABLES = [
  'states',
  'districts',
  'talukas',
  'villages',
  'religions',
  'castes',
  'parties',
  'parliamentary_constituencies',
  'assembly_constituencies',
  'wards',
  'booths',
  'voters',
  'tenant_users',
  'user_booth_assignments',
  'tenant_user_roles',
  'campaign_settings',
  'tenant_sync_outbox',
];

// ─── Master lookup tables to compare row counts ────────────────────────────────
const LOOKUP_TABLES = [
  'states',
  'districts',
  'talukas',
  'villages',
  'religions',
  'castes',
  'parties',
  'parliamentary_constituencies',
  'assembly_constituencies',
  'wards',
  'booths',
];

export interface TableSyncRow {
  master: number;
  tenant: number;
  synced: boolean;
}

export interface SchemaDrift {
  table: string;
  issue: string;
  masterColumns?: string[];
  tenantColumns?: string[];
}

export interface TenantDbSyncStatus {
  tenantId: string;
  tenantDbName: string;
  syncStatus: 'synced' | 'out_of_sync' | 'unreachable' | 'partially_synced';
  isReachable: boolean;
  isSchemaSynced: boolean;
  isDataSynced: boolean;
  voterCountMaster: number;
  voterCountTenant: number;
  voterCountDiff: number;
  masterLookupSync: Record<string, TableSyncRow>;
  missingTables: string[];
  schemaDrift: SchemaDrift[];
  checkedAt: Date;
}

export class TenantSyncService {
  /**
   * Compares the tenant DB against the master DB to determine sync health.
   * Checks schema presence, column consistency, voter counts, and lookup table counts.
   */
  static async checkDbSyncStatus(tenantId: string): Promise<TenantDbSyncStatus> {
    const tenant = await TenantQueries.getById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID '${tenantId}' not found`);
    }

    const { tenantDbName, acIds, pcIds } = tenant;
    const checkedAt = new Date();

    // ── 1. Reachability check ────────────────────────────────────────────────
    let isReachable = false;
    const tenantPool = getTenantDbPool(tenantDbName);
    try {
      await tenantPool.query('SELECT 1');
      isReachable = true;
    } catch (err: any) {
      logger.warn(`[TenantSyncService] Tenant DB '${tenantDbName}' is unreachable: ${err.message}`);
      await tenantPool.end().catch(() => { });
      return {
        tenantId,
        tenantDbName,
        syncStatus: 'unreachable',
        isReachable: false,
        isSchemaSynced: false,
        isDataSynced: false,
        voterCountMaster: 0,
        voterCountTenant: 0,
        voterCountDiff: 0,
        masterLookupSync: {},
        missingTables: [],
        schemaDrift: [],
        checkedAt,
      };
    }

    try {
      // ── 2. Schema check — existing tables in tenant DB (pg_tables is fast) ──
      const tenantTablesRes = await tenantPool.query(`
        SELECT tablename AS table_name
        FROM pg_tables
        WHERE schemaname = 'public'
      `);
      const tenantTables: string[] = tenantTablesRes.rows.map((r: any) => r.table_name);

      const missingTables = EXPECTED_TENANT_TABLES.filter((t) => !tenantTables.includes(t));

      // ── 3. Schema drift — column comparison for common tables ───────────────
      const schemaDrift: SchemaDrift[] = [];
      const commonTables = EXPECTED_TENANT_TABLES.filter((t) => tenantTables.includes(t));

      for (const table of commonTables) {
        // Get master DB columns for this table
        const masterColRes = await masterQuery(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [table]
        );
        const masterCols: string[] = masterColRes.rows.map((r: any) => r.column_name);

        if (masterCols.length === 0) {
          // Table doesn't exist in master — skip drift check
          continue;
        }

        // Get tenant DB columns for this table
        const tenantColRes = await tenantPool.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [table]
        );
        const tenantCols: string[] = tenantColRes.rows.map((r: any) => r.column_name);

        const missingInTenant = masterCols.filter((c) => !tenantCols.includes(c));
        const extraInTenant = tenantCols.filter((c) => !masterCols.includes(c));

        if (missingInTenant.length > 0 || extraInTenant.length > 0) {
          schemaDrift.push({
            table,
            issue: [
              missingInTenant.length > 0 ? `Missing columns in tenant: [${missingInTenant.join(', ')}]` : '',
              extraInTenant.length > 0 ? `Extra columns in tenant: [${extraInTenant.join(', ')}]` : '',
            ].filter(Boolean).join('. '),
            masterColumns: masterCols,
            tenantColumns: tenantCols,
          });
        }
      }

      if (schemaDrift.length > 0) {
        logger.warn(`[TenantSyncService] Schema drift in '${tenantDbName}': ${JSON.stringify(schemaDrift)}`);
      }

      const isSchemaSynced = missingTables.length === 0 && schemaDrift.length === 0;

      // ── 4. Voter count comparison ────────────────────────────────────────────
      // ── 4. Resolve assigned constituency scope ──────────────────────────────
      const rawAcIds: string[] = Array.isArray(acIds) ? acIds : [];
      const rawPcIds: string[] = Array.isArray(pcIds) ? pcIds : [];

      // 1. Resolve PC IDs (from directly assigned pcIds + parent PCs of acIds)
      const pcIdSet = new Set<string>(rawPcIds.filter(Boolean));
      if (rawAcIds.length > 0) {
        const parentPcRes = await masterQuery(
          `SELECT DISTINCT pc_id FROM assembly_constituencies WHERE id = ANY($1::uuid[]) AND pc_id IS NOT NULL`,
          [rawAcIds]
        );
        for (const r of parentPcRes.rows) {
          if (r.pc_id) pcIdSet.add(r.pc_id);
        }
      }
      const resolvedPcIds = Array.from(pcIdSet);

      // 2. Resolve AC IDs (from directly assigned acIds + child ACs of pcIds)
      const acIdSet = new Set<string>(rawAcIds.filter(Boolean));
      if (rawPcIds.length > 0) {
        const childAcRes = await masterQuery(
          `SELECT id FROM assembly_constituencies WHERE pc_id = ANY($1::uuid[])`,
          [rawPcIds]
        );
        for (const r of childAcRes.rows) {
          if (r.id) acIdSet.add(r.id);
        }
      }
      const resolvedAcIds = Array.from(acIdSet);

      // ── 5. Voter count comparison (scoped to assigned ACs) ───────────────────
      let voterCountMaster = 0;
      let voterCountTenant = 0;

      if (resolvedAcIds.length > 0) {
        const masterVoterRes = await masterQuery(
          `SELECT COUNT(*)::int AS total FROM voters WHERE ac_id = ANY($1::uuid[])`,
          [resolvedAcIds]
        );
        voterCountMaster = masterVoterRes.rows[0]?.total || 0;
      }

      if (tenantTables.includes('voters')) {
        const tenantVoterRes = await tenantPool.query(
          `SELECT COUNT(*)::int AS total FROM voters`
        );
        voterCountTenant = tenantVoterRes.rows[0]?.total || 0;
      }

      const voterCountDiff = voterCountMaster - voterCountTenant;
      const isVotersSynced = voterCountDiff === 0;

      // ── 6. Master lookup table row count comparison ──────────────────────────
      // Global master tables (copy all): states, districts, talukas, villages, religions, castes, parties
      // Scoped constituency tables (only assigned): parliamentary_constituencies, assembly_constituencies, wards, booths
      const masterLookupSync: Record<string, TableSyncRow> = {};

      const GLOBAL_LOOKUP_TABLES = [
        'states',
        'districts',
        'talukas',
        'villages',
        'religions',
        'castes',
        'parties',
      ];

      for (const table of GLOBAL_LOOKUP_TABLES) {
        let masterCount = 0;
        let tenantCount = 0;

        try {
          const mRes = await masterQuery(`SELECT COUNT(*)::int AS total FROM ${table}`);
          masterCount = mRes.rows[0]?.total || 0;
        } catch {
          masterCount = 0;
        }

        if (tenantTables.includes(table)) {
          try {
            const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM ${table}`);
            tenantCount = tRes.rows[0]?.total || 0;
          } catch {
            tenantCount = 0;
          }
        }

        masterLookupSync[table] = {
          master: masterCount,
          tenant: tenantCount,
          synced: masterCount === tenantCount,
        };
      }

      // Scoped tables: Parliamentary Constituencies
      let pcMasterCount = 0;
      let pcTenantCount = 0;
      if (resolvedPcIds.length > 0) {
        try {
          const mRes = await masterQuery(
            `SELECT COUNT(*)::int AS total FROM parliamentary_constituencies WHERE id = ANY($1::uuid[])`,
            [resolvedPcIds]
          );
          pcMasterCount = mRes.rows[0]?.total || 0;
        } catch {
          pcMasterCount = 0;
        }
      }
      if (tenantTables.includes('parliamentary_constituencies')) {
        try {
          const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM parliamentary_constituencies`);
          pcTenantCount = tRes.rows[0]?.total || 0;
        } catch {
          pcTenantCount = 0;
        }
      }
      masterLookupSync['parliamentary_constituencies'] = {
        master: pcMasterCount,
        tenant: pcTenantCount,
        synced: pcMasterCount === pcTenantCount,
      };

      // Scoped tables: Assembly Constituencies
      let acMasterCount = 0;
      let acTenantCount = 0;
      if (resolvedAcIds.length > 0) {
        try {
          const mRes = await masterQuery(
            `SELECT COUNT(*)::int AS total FROM assembly_constituencies WHERE id = ANY($1::uuid[])`,
            [resolvedAcIds]
          );
          acMasterCount = mRes.rows[0]?.total || 0;
        } catch {
          acMasterCount = 0;
        }
      }
      if (tenantTables.includes('assembly_constituencies')) {
        try {
          const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM assembly_constituencies`);
          acTenantCount = tRes.rows[0]?.total || 0;
        } catch {
          acTenantCount = 0;
        }
      }
      masterLookupSync['assembly_constituencies'] = {
        master: acMasterCount,
        tenant: acTenantCount,
        synced: acMasterCount === acTenantCount,
      };

      // Scoped tables: Wards
      let wardMasterCount = 0;
      let wardTenantCount = 0;
      if (resolvedAcIds.length > 0) {
        try {
          const mRes = await masterQuery(
            `SELECT COUNT(*)::int AS total FROM wards WHERE ac_id = ANY($1::uuid[])`,
            [resolvedAcIds]
          );
          wardMasterCount = mRes.rows[0]?.total || 0;
        } catch {
          wardMasterCount = 0;
        }
      }
      if (tenantTables.includes('wards')) {
        try {
          const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM wards`);
          wardTenantCount = tRes.rows[0]?.total || 0;
        } catch {
          wardTenantCount = 0;
        }
      }
      masterLookupSync['wards'] = {
        master: wardMasterCount,
        tenant: wardTenantCount,
        synced: wardMasterCount === wardTenantCount,
      };

      // Scoped tables: Polling Booths
      let boothMasterCount = 0;
      let boothTenantCount = 0;
      if (resolvedAcIds.length > 0) {
        try {
          const mRes = await masterQuery(
            `SELECT COUNT(*)::int AS total FROM booths WHERE ac_id = ANY($1::uuid[])`,
            [resolvedAcIds]
          );
          boothMasterCount = mRes.rows[0]?.total || 0;
        } catch {
          boothMasterCount = 0;
        }
      }
      if (tenantTables.includes('booths')) {
        try {
          const tRes = await tenantPool.query(`SELECT COUNT(*)::int AS total FROM booths`);
          boothTenantCount = tRes.rows[0]?.total || 0;
        } catch {
          boothTenantCount = 0;
        }
      }
      masterLookupSync['booths'] = {
        master: boothMasterCount,
        tenant: boothTenantCount,
        synced: boothMasterCount === boothTenantCount,
      };

      const isLookupSynced = Object.values(masterLookupSync).every((v) => v.synced);
      const isDataSynced = isVotersSynced && isLookupSynced;

      // ── 6. Overall sync status ───────────────────────────────────────────────
      let syncStatus: TenantDbSyncStatus['syncStatus'];
      if (isSchemaSynced && isDataSynced) {
        syncStatus = 'synced';
      } else if (!isSchemaSynced && !isDataSynced) {
        syncStatus = 'out_of_sync';
      } else {
        syncStatus = 'partially_synced';
      }

      logger.info(`[TenantSyncService] Sync check for '${tenantDbName}': ${syncStatus} | voters master=${voterCountMaster} tenant=${voterCountTenant}`);

      return {
        tenantId,
        tenantDbName,
        syncStatus,
        isReachable,
        isSchemaSynced,
        isDataSynced,
        voterCountMaster,
        voterCountTenant,
        voterCountDiff,
        masterLookupSync,
        missingTables,
        schemaDrift,
        checkedAt,
      };
    } finally {
      await tenantPool.end().catch(() => { });
    }
  }
}
