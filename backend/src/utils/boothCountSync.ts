import { Pool } from 'pg';
import { logger } from './logger';
import { query as masterQuery } from '../queries/dbPool';
import { CacheService } from '../services/cache.service';
import { TenantPoolManager } from '../services/pool/tenantPoolManager';
import { MasterCacheInvalidator } from '../services/cacheInvalidation.service';

/**
 * Invalidates Redis dashboard caches and marks the tenant_dashboard_stats rollup
 * row as stale so the next dashboard request recomputes fresh metrics immediately.
 */
export async function invalidateTenantDashboardCache(tenantDbName?: string | null): Promise<void> {
  const cleanDb = tenantDbName?.trim();
  if (!cleanDb) return;

  try {
    await Promise.all([
      CacheService.del(`ranniti:tenant:stats:${cleanDb}`),
      CacheService.invalidatePattern(`ranniti:tenant:overview:${cleanDb}*`),
      TenantPoolManager.query(
        cleanDb,
        `UPDATE tenant_dashboard_stats SET last_synced_at = to_timestamp(0) WHERE tenant_db_name = $1`,
        [cleanDb]
      ).catch(() => { }),
    ]);
  } catch (err: any) {
    logger.warn(`[BoothCountSync] Failed to invalidate dashboard cache for '${cleanDb}': ${err.message}`);
  }
}

/**
 * Recalculates `tenants.total_voters_copied` in the Master DB from the live
 * voter count in the tenant's isolated database.
 */
export async function syncTenantTotalVoters(tenantDbName?: string | null): Promise<void> {
  const cleanDb = tenantDbName?.trim();
  if (!cleanDb) return;

  try {
    const countRes = await TenantPoolManager.query(cleanDb, `SELECT COUNT(*)::int AS total FROM voters`);
    const total = countRes.rows[0]?.total ?? 0;
    await masterQuery(
      `UPDATE tenants SET total_voters_copied = $1, updated_at = NOW() WHERE tenant_db_name = $2`,
      [total, cleanDb]
    );
  } catch (err: any) {
    logger.warn(`[BoothCountSync] Failed to sync tenants.total_voters_copied for '${cleanDb}': ${err.message}`);
  }
}

async function runOnTargetDb(
  sql: string,
  params: any[],
  tenantDbName?: string | null,
  poolOverride?: Pool
): Promise<void> {
  if (poolOverride) {
    await poolOverride.query(sql, params);
  } else if (tenantDbName && tenantDbName.trim()) {
    await TenantPoolManager.query(tenantDbName.trim(), sql, params);
  } else {
    await masterQuery(sql, params);
  }
}

/**
 * Recalculates and persists `booths.total_voters` (and `election_booth_turnout.total_voters`
 * in tenant DBs) from the live `voters` table for the specified booth IDs,
 * and invalidates booths and dashboard caches.
 */
export async function syncBoothTotalVoters(
  boothIds: Array<string | null | undefined>,
  tenantDbName?: string | null,
  poolOverride?: Pool
): Promise<void> {
  const uniqueIds = Array.from(
    new Set(boothIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
  );
  if (uniqueIds.length === 0) return;

  const updateBoothsSql = `
    UPDATE booths b
    SET total_voters = COALESCE(sub.voter_count, 0),
        updated_at = NOW()
    FROM (
      SELECT u.id AS booth_id, COUNT(v.id)::int AS voter_count
      FROM unnest($1::uuid[]) AS u(id)
      LEFT JOIN voters v ON v.booth_id = u.id
      GROUP BY u.id
    ) sub
    WHERE b.id = sub.booth_id;
  `;

  try {
    await runOnTargetDb(updateBoothsSql, [uniqueIds], tenantDbName, poolOverride);

    if (poolOverride || (tenantDbName && tenantDbName.trim())) {
      const updateTurnoutSql = `
        UPDATE election_booth_turnout ebt
        SET total_voters = b.total_voters,
            updated_at = NOW()
        FROM booths b
        WHERE ebt.booth_id = b.id
          AND ebt.booth_id = ANY($1::uuid[])
          AND ebt.total_voters IS DISTINCT FROM b.total_voters;
      `;
      await runOnTargetDb(updateTurnoutSql, [uniqueIds], tenantDbName, poolOverride).catch(() => { });
    }

    await MasterCacheInvalidator.invalidate(['booths'], tenantDbName || undefined);
    await invalidateTenantDashboardCache(tenantDbName);
  } catch (err: any) {
    logger.warn(`[BoothCountSync] Failed to sync total_voters for ${uniqueIds.length} booth(s): ${err.message}`);
  }
}

/**
 * Recalculates and persists `booths.total_voters` (and `election_booth_turnout.total_voters`
 * in tenant DBs) from the live `voters` table for all booths belonging to the specified AC IDs.
 */
export async function syncBoothTotalVotersForAcs(
  acIds: string[],
  tenantDbName?: string | null,
  poolOverride?: Pool
): Promise<void> {
  const uniqueAcIds = Array.from(
    new Set(acIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
  );
  if (uniqueAcIds.length === 0) return;

  const updateBoothsSql = `
    UPDATE booths b
    SET total_voters = COALESCE(sub.voter_count, 0),
        updated_at = NOW()
    FROM (
      SELECT b2.id AS booth_id, COUNT(v.id)::int AS voter_count
      FROM booths b2
      LEFT JOIN voters v ON v.booth_id = b2.id
      WHERE b2.ac_id = ANY($1::uuid[])
      GROUP BY b2.id
    ) sub
    WHERE b.id = sub.booth_id;
  `;

  try {
    await runOnTargetDb(updateBoothsSql, [uniqueAcIds], tenantDbName, poolOverride);

    if (poolOverride || (tenantDbName && tenantDbName.trim())) {
      const updateTurnoutSql = `
        UPDATE election_booth_turnout ebt
        SET total_voters = b.total_voters,
            updated_at = NOW()
        FROM booths b
        WHERE ebt.booth_id = b.id
          AND b.ac_id = ANY($1::uuid[])
          AND ebt.total_voters IS DISTINCT FROM b.total_voters;
      `;
      await runOnTargetDb(updateTurnoutSql, [uniqueAcIds], tenantDbName, poolOverride).catch(() => { });
    }

    await MasterCacheInvalidator.invalidate(['booths'], tenantDbName || undefined);
    await invalidateTenantDashboardCache(tenantDbName);
  } catch (err: any) {
    logger.warn(`[BoothCountSync] Failed to sync total_voters for ${uniqueAcIds.length} AC(s): ${err.message}`);
  }
}
