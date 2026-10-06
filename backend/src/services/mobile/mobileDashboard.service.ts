import { logger } from '../../utils/logger';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../../services/pool/tenantPoolManager';

export interface MobileDashboardMetrics {
  assignedBoothsCount: number;
  totalVotersCount: number;
  hierarchy: {
    acLeadersCount: number;
    subLeadersCount: number;
    supportersCount: number;
  };
  influencers: {
    familyInfluencersCount: number;
    socialInfluencersCount: number;
    totalInfluencersCount: number;
  };
  syncedContactsVotersCount: number;
  genderData: {
    male: number;
    female: number;
    other: number;
  };
  ageData: {
    youth: number;
    adult: number;
    senior: number;
  };
  turnoutData: {
    votedCount: number;
    totalVoters: number;
  };
}

export class MobileDashboardService {
  /**
   * Fetches real-time dashboard metrics scoped to user's assigned PC / AC / booths in the target tenant DB
   */
  async getDashboardMetrics(params: {
    role: string;
    userId: string;
    tenantDbName?: string | null;
    assignedPcId?: string | null;
    assignedAcId?: string | null;
    assignedBoothIds?: string[];
  }): Promise<MobileDashboardMetrics> {
    const { userId, role, tenantDbName, assignedPcId, assignedAcId } = params;
    let assignedBoothIds = params.assignedBoothIds || [];

    // Helper for executing query against tenant pool
    const executeTenantQuery = async (sqlStr: string, sqlParams: any[] = []) => {
      if (tenantDbName && tenantDbName.trim()) {
        const pool = TenantPoolManager.getPool(tenantDbName.trim());
        return await pool.query(sqlStr, sqlParams);
      }
      return await masterQuery(sqlStr, sqlParams);
    };

    // 1. Fetch assigned booth IDs if not supplied in token payload
    if (!assignedBoothIds || assignedBoothIds.length === 0) {
      try {
        const boothRes = await executeTenantQuery(`SELECT booth_id FROM user_booth_assignments WHERE user_id = $1`, [userId]);
        assignedBoothIds = boothRes.rows.map((r: { booth_id: string }) => r.booth_id);
      } catch (err) {
        logger.warn(`[MobileDashboardService] Error fetching user_booth_assignments:`, err);
      }
    }

    // Calculate assigned booths count
    let assignedBoothsCount = assignedBoothIds.length;
    if (assignedBoothsCount === 0 && assignedAcId) {
      try {
        const acBoothRes = await executeTenantQuery(
          `SELECT COUNT(*)::int AS count FROM booths WHERE ac_id = $1`,
          [assignedAcId]
        );
        assignedBoothsCount = acBoothRes.rows[0]?.count || 0;
      } catch (err) {
        logger.warn(`[MobileDashboardService] Error querying booth count for AC ${assignedAcId}:`, err);
      }
    } else if (assignedBoothsCount === 0 && assignedPcId) {
      try {
        const pcBoothRes = await executeTenantQuery(
          `SELECT COUNT(*)::int AS count FROM booths WHERE pc_id = $1`,
          [assignedPcId]
        );
        assignedBoothsCount = pcBoothRes.rows[0]?.count || 0;
      } catch (err) {
        logger.warn(`[MobileDashboardService] Error querying booth count for PC ${assignedPcId}:`, err);
      }
    }

    // Determine booth / AC / PC filter clause for tenant voters SQL query
    const isAcOrPcLeader = role === 'ac_leader' || role === 'pc_leader' || role === 'tenant_admin' || role === 'super_admin';
    const hasAcFilter = Boolean(assignedAcId);
    const hasPcFilter = Boolean(assignedPcId);
    const hasBoothFilter = assignedBoothIds && assignedBoothIds.length > 0 && (!isAcOrPcLeader || (!hasAcFilter && !hasPcFilter));

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (hasBoothFilter) {
      queryParams.push(assignedBoothIds);
      whereClause += ` AND booth_id = ANY($${queryParams.length})`;
    } else if (hasAcFilter) {
      queryParams.push(assignedAcId);
      whereClause += ` AND ac_id = $${queryParams.length}`;
    } else if (hasPcFilter) {
      queryParams.push(assignedPcId);
      whereClause += ` AND pc_id = $${queryParams.length}`;
    }

    // 2. Query Voter Statistics from Tenant DB
    const voterCountRes = await executeTenantQuery(
      `SELECT COUNT(*)::int AS total,
              COUNT(CASE WHEN status = 'VOTED' THEN 1 END)::int AS voted_count,
              COUNT(CASE WHEN is_family_influencer = true THEN 1 END)::int AS family_influencers,
              COUNT(CASE WHEN is_social_influencer = true THEN 1 END)::int AS social_influencers,
              COUNT(CASE WHEN LOWER(gender) IN ('male', 'm') THEN 1 END)::int AS male_count,
              COUNT(CASE WHEN LOWER(gender) IN ('female', 'f') THEN 1 END)::int AS female_count,
              COUNT(CASE WHEN LOWER(gender) NOT IN ('male', 'm', 'female', 'f') AND gender IS NOT NULL THEN 1 END)::int AS other_gender,
              COUNT(CASE WHEN age >= 18 AND age <= 30 THEN 1 END)::int AS youth_age,
              COUNT(CASE WHEN age >= 31 AND age <= 50 THEN 1 END)::int AS adult_age,
              COUNT(CASE WHEN age > 50 THEN 1 END)::int AS senior_age
       FROM voters ${whereClause}`,
      queryParams
    );

    const row = voterCountRes.rows[0] || {};
    const totalVotersCount = parseInt(row.total || '0', 10);
    const votedCount = parseInt(row.voted_count || '0', 10);
    const familyInfluencersCount = parseInt(row.family_influencers || '0', 10);
    const socialInfluencersCount = parseInt(row.social_influencers || '0', 10);

    // 2b. Query Synced Contacts Count from user_synced_contacts table (voters synced from mobile address book)
    let syncedContactsVotersCount = 0;
    try {
      const syncRes = await executeTenantQuery(
        `SELECT COUNT(DISTINCT voter_id)::int AS count FROM user_synced_contacts WHERE user_id = $1`,
        [userId]
      );
      syncedContactsVotersCount = parseInt(syncRes.rows[0]?.count || '0', 10);
    } catch {
      syncedContactsVotersCount = 0;
    }

    // 3. Query Team Hierarchy Counts from Tenant DB (`tenant_users`)
    let acLeadersCount = 0;
    let subLeadersCount = 0;
    let supportersCount = 0;

    try {
      if (role === 'pc_leader') {
        const teamRes = await executeTenantQuery(
          `WITH RECURSIVE team_hierarchy AS (
             SELECT id, role, parent_leader_id
             FROM tenant_users
             WHERE parent_leader_id = $1 OR (role = 'ac_leader' AND id != $1)
             UNION ALL
             SELECT u.id, u.role, u.parent_leader_id
             FROM tenant_users u
             INNER JOIN team_hierarchy th ON u.parent_leader_id = th.id
           )
           SELECT role, COUNT(*)::int AS count
           FROM team_hierarchy
           GROUP BY role`,
          [userId]
        );
        for (const tRow of teamRes.rows) {
          if (tRow.role === 'ac_leader') acLeadersCount = parseInt(tRow.count, 10);
          if (tRow.role === 'sub_leader') subLeadersCount = parseInt(tRow.count, 10);
          if (tRow.role === 'supporter') supportersCount = parseInt(tRow.count, 10);
        }
      } else if (role === 'ac_leader') {
        const teamRes = await executeTenantQuery(
          `WITH RECURSIVE team_hierarchy AS (
             SELECT id, role, parent_leader_id
             FROM tenant_users
             WHERE parent_leader_id = $1
             UNION ALL
             SELECT u.id, u.role, u.parent_leader_id
             FROM tenant_users u
             INNER JOIN team_hierarchy th ON u.parent_leader_id = th.id
           )
           SELECT role, COUNT(*)::int AS count
           FROM team_hierarchy
           GROUP BY role`,
          [userId]
        );
        for (const tRow of teamRes.rows) {
          if (tRow.role === 'sub_leader') subLeadersCount = parseInt(tRow.count, 10);
          if (tRow.role === 'supporter') supportersCount = parseInt(tRow.count, 10);
        }
      } else if (role === 'sub_leader') {
        const teamRes = await executeTenantQuery(
          `SELECT role, COUNT(*)::int AS count 
           FROM tenant_users 
           WHERE parent_leader_id = $1
           GROUP BY role`,
          [userId]
        );
        for (const tRow of teamRes.rows) {
          if (tRow.role === 'supporter') supportersCount = parseInt(tRow.count, 10);
        }
      } else {
        const teamRes = await executeTenantQuery(
          `SELECT role, COUNT(*)::int AS count 
           FROM tenant_users 
           WHERE id != $1
           GROUP BY role`,
          [userId]
        );
        for (const tRow of teamRes.rows) {
          if (tRow.role === 'ac_leader') acLeadersCount = parseInt(tRow.count, 10);
          if (tRow.role === 'sub_leader') subLeadersCount = parseInt(tRow.count, 10);
          if (tRow.role === 'supporter') supportersCount = parseInt(tRow.count, 10);
        }
      }
    } catch (err) {
      logger.warn(`[MobileDashboardService] Error fetching team hierarchy counts from Tenant DB:`, err);
    }

    return {
      assignedBoothsCount,
      totalVotersCount,
      hierarchy: {
        acLeadersCount,
        subLeadersCount,
        supportersCount,
      },
      influencers: {
        familyInfluencersCount,
        socialInfluencersCount,
        totalInfluencersCount: familyInfluencersCount + socialInfluencersCount,
      },
      syncedContactsVotersCount,
      genderData: {
        male: parseInt(row.male_count || '0', 10),
        female: parseInt(row.female_count || '0', 10),
        other: parseInt(row.other_gender || '0', 10),
      },
      ageData: {
        youth: parseInt(row.youth_age || '0', 10),
        adult: parseInt(row.adult_age || '0', 10),
        senior: parseInt(row.senior_age || '0', 10),
      },
      turnoutData: {
        votedCount,
        totalVoters: totalVotersCount,
      },
    };
  }
}

export const mobileDashboardService = new MobileDashboardService();
