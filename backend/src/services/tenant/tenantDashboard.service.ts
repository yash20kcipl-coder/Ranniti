import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../cache.service';
import { TenantPoolManager } from '../pool/tenantPoolManager';

export interface AgeCohorts {
  age_18_25: number;
  age_26_35: number;
  age_36_50: number;
  age_51_65: number;
  age_65_plus: number;
  age_unknown: number;
}

export interface RegistrationVelocityPoint {
  date: string;
  count: number;
}

export interface BoothCoverageByRoleItem {
  role: string;
  roleName: string;
  volunteerCount: number;
  coveredBoothsCount: number;
}

export interface TenantDashboardStats {
  tenantDbName: string;
  totalVoters: number;
  totalBooths: number;
  totalVolunteers: number;
  assignedBoothsCount: number;
  genderBreakdown: { male: number; female: number; other: number };
  partyBreakdown: Array<{ partyId: string | null; partyName: string; count: number; color?: string }>;
  ageCohorts: AgeCohorts;
  registrationVelocity: RegistrationVelocityPoint[];
  acBreakdown: Array<{ acId: string; acName: string; voterCount: number }>;
  boothCoverageByRole: BoothCoverageByRoleItem[];
  recentVoters: Array<{
    id: string;
    epicNo: string;
    name: string;
    gender: string;
    age: number;
    partyId?: string;
    partyName?: string;
    createdAt: string;
  }>;
  lastSyncedAt?: string;
}

export class TenantDashboardService {
  private static CACHE_TTL_SECONDS = 300; // 5 minutes

  /**
   * Ensures the tenant_dashboard_stats rollup table exists in the tenant database
   */
  private static async ensureTableExists(tenantPool: any): Promise<void> {
    try {
      await tenantPool.query(`
        CREATE TABLE IF NOT EXISTS tenant_dashboard_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_db_name VARCHAR(100) UNIQUE NOT NULL,
          total_voters INT DEFAULT 0,
          total_booths INT DEFAULT 0,
          assigned_booths_count INT DEFAULT 0,
          total_volunteers INT DEFAULT 0,
          gender_breakdown JSONB NOT NULL DEFAULT '{"male": 0, "female": 0, "other": 0}'::jsonb,
          party_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
          age_cohorts JSONB NOT NULL DEFAULT '{"age_18_25": 0, "age_26_35": 0, "age_36_50": 0, "age_51_65": 0, "age_65_plus": 0, "age_unknown": 0}'::jsonb,
          registration_velocity JSONB NOT NULL DEFAULT '[]'::jsonb,
          ac_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
          booth_coverage_by_role JSONB NOT NULL DEFAULT '[]'::jsonb,
          last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_tenant_dashboard_stats_tenant_db ON tenant_dashboard_stats(tenant_db_name);
        ALTER TABLE tenant_dashboard_stats ADD COLUMN IF NOT EXISTS booth_coverage_by_role JSONB NOT NULL DEFAULT '[]'::jsonb;
      `);
    } catch (err: any) {
      logger.warn(`Failed to verify tenant_dashboard_stats table: ${err.message}`);
    }
  }

  /**
   * Fast Read (<5ms)
   * Fetches the dashboard metrics from Cache or Rollup Table.
   */
  static async getMetrics(tenantDbName: string, forceRefresh = false): Promise<TenantDashboardStats> {
    if (!tenantDbName) {
      throw ApiError.badRequest('No tenant database is assigned to this account');
    }

    const cacheKey = `ranniti:tenant:stats:${tenantDbName}`;

    if (forceRefresh) {
      await CacheService.del(cacheKey);
      return await this.recalculateMetrics(tenantDbName);
    }

    return await CacheService.getOrSet(cacheKey, this.CACHE_TTL_SECONDS, async () => {
      // Attempt to load from tenant_dashboard_stats table first
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      await this.ensureTableExists(tenantPool);

      try {
        const statsRowRes = await tenantPool.query(
          `SELECT * FROM tenant_dashboard_stats WHERE tenant_db_name = $1 LIMIT 1`,
          [tenantDbName]
        );

        if (statsRowRes.rows.length > 0) {
          const row = statsRowRes.rows[0];
          const ageMinutes = (Date.now() - new Date(row.last_synced_at).getTime()) / (1000 * 60);

          if (ageMinutes < 15) {
            // Fresh enough, attach recent voters and return
            const recentVoters = await this.getRecentVoters(tenantPool);
            return {
              tenantDbName,
              totalVoters: Number(row.total_voters || 0),
              totalBooths: Number(row.total_booths || 0),
              assignedBoothsCount: Number(row.assigned_booths_count || 0),
              totalVolunteers: Number(row.total_volunteers || 0),
              genderBreakdown: row.gender_breakdown || { male: 0, female: 0, other: 0 },
              partyBreakdown: Array.isArray(row.party_breakdown) ? row.party_breakdown : [],
              ageCohorts: row.age_cohorts || {
                age_18_25: 0,
                age_26_35: 0,
                age_36_50: 0,
                age_51_65: 0,
                age_65_plus: 0,
                age_unknown: 0,
              },
              registrationVelocity: Array.isArray(row.registration_velocity) ? row.registration_velocity : [],
              acBreakdown: Array.isArray(row.ac_breakdown) ? row.ac_breakdown : [],
              boothCoverageByRole: Array.isArray(row.booth_coverage_by_role) ? row.booth_coverage_by_role : [],
              recentVoters,
              lastSyncedAt: row.last_synced_at,
            };
          }
        }
      } catch (err: any) {
        logger.warn(`Could not read tenant_dashboard_stats table: ${err.message}`);
      }

      return await this.recalculateMetrics(tenantDbName);
    });
  }

  /**
   * Recalculate Metrics (Single-Pass Execution)
   * High performance aggregation over the voter base.
   */
  static async recalculateMetrics(tenantDbName: string): Promise<TenantDashboardStats> {
    const tenantPool = TenantPoolManager.getPool(tenantDbName);
    await this.ensureTableExists(tenantPool);

    logger.info(`🔄 Recalculating campaign dashboard metrics for ${tenantDbName}...`);

    // 1. Single-Pass Aggregation: Total, Gender & Age Cohorts
    let totalVoters = 0;
    const genderBreakdown = { male: 0, female: 0, other: 0 };
    const ageCohorts: AgeCohorts = {
      age_18_25: 0,
      age_26_35: 0,
      age_36_50: 0,
      age_51_65: 0,
      age_65_plus: 0,
      age_unknown: 0,
    };

    try {
      const singlePassRes = await tenantPool.query(`
        SELECT
          COUNT(*)::int AS "totalVoters",
          COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) IN ('m', 'male'))::int AS "maleVoters",
          COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) IN ('f', 'female'))::int AS "femaleVoters",
          COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) NOT IN ('m', 'male', 'f', 'female'))::int AS "otherVoters",
          COUNT(*) FILTER (WHERE age BETWEEN 18 AND 25)::int AS "age_18_25",
          COUNT(*) FILTER (WHERE age BETWEEN 26 AND 35)::int AS "age_26_35",
          COUNT(*) FILTER (WHERE age BETWEEN 36 AND 50)::int AS "age_36_50",
          COUNT(*) FILTER (WHERE age BETWEEN 51 AND 65)::int AS "age_51_65",
          COUNT(*) FILTER (WHERE age > 65)::int AS "age_65_plus",
          COUNT(*) FILTER (WHERE age IS NULL OR age < 18)::int AS "age_unknown"
        FROM voters
      `);

      const r = singlePassRes.rows[0] || {};
      totalVoters = Number(r.totalVoters || 0);
      genderBreakdown.male = Number(r.maleVoters || 0);
      genderBreakdown.female = Number(r.femaleVoters || 0);
      genderBreakdown.other = Number(r.otherVoters || 0);

      ageCohorts.age_18_25 = Number(r.age_18_25 || 0);
      ageCohorts.age_26_35 = Number(r.age_26_35 || 0);
      ageCohorts.age_36_50 = Number(r.age_36_50 || 0);
      ageCohorts.age_51_65 = Number(r.age_51_65 || 0);
      ageCohorts.age_65_plus = Number(r.age_65_plus || 0);
      ageCohorts.age_unknown = Number(r.age_unknown || 0);
    } catch (err: any) {
      logger.error(`Error in single-pass aggregation query: ${err.message}`);
    }

    // 2. Bounded 14-Day Velocity using continuous calendar series
    const registrationVelocity: RegistrationVelocityPoint[] = [];
    try {
      const velocityRes = await tenantPool.query(`
        WITH date_series AS (
          SELECT TO_CHAR(d.day, 'YYYY-MM-DD') AS date
          FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d(day)
        ),
        daily_counts AS (
          SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
          FROM voters
          WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
          GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        )
        SELECT ds.date, COALESCE(dc.count, 0)::int AS count
        FROM date_series ds
        LEFT JOIN daily_counts dc ON dc.date = ds.date
        ORDER BY ds.date ASC
      `);
      velocityRes.rows.forEach((row: any) => {
        registrationVelocity.push({
          date: row.date,
          count: parseInt(row.count, 10),
        });
      });
    } catch (err: any) {
      logger.warn(`Velocity query error: ${err.message}`);
    }

    // 3. Party Breakdown (Voter Sentiment & Political Leanings)
    const partyBreakdown: Array<{ partyId: string | null; partyName: string; count: number; color?: string }> = [];
    try {
      const partyRes = await tenantPool.query(`
        SELECT 
          v.party_id AS "partyId", 
          COALESCE(p.name, 'Uncommitted / Swing Base') AS "partyName",
          p.abbreviation AS "abbreviation",
          COUNT(*)::int AS "count"
        FROM voters v
        LEFT JOIN parties p ON p.id = v.party_id
        GROUP BY v.party_id, p.name, p.abbreviation
        ORDER BY "count" DESC
      `);

      const getPartyPaletteColor = (abbr?: string, name?: string): string => {
        const text = (abbr || name || '').toUpperCase();
        if (text.includes('BJP')) return '#FF9933'; // Saffron
        if (text.includes('INC') || text.includes('CONGRESS')) return '#06B6D4'; // Cyan
        if (text.includes('AAP')) return '#10B981'; // Green
        if (text.includes('SHS') || text.includes('SHIV')) return '#F97316'; // Orange
        if (text.includes('NCP')) return '#3B82F6'; // Blue
        if (text.includes('BSP')) return '#2563EB'; // Deep Blue
        if (text.includes('CPI') || text.includes('COMMUNIST')) return '#DC2626'; // Red
        if (text.includes('SP') || text.includes('SAMAJWADI')) return '#EF4444'; // Red
        if (text.includes('IND') || text.includes('INDEPENDENT')) return '#8B5CF6'; // Purple
        return '#94A3B8'; // Slate Neutral
      };

      partyRes.rows.forEach((r: any) => {
        partyBreakdown.push({
          partyId: r.partyId || null,
          partyName: r.partyName,
          count: parseInt(r.count, 10),
          color: getPartyPaletteColor(r.abbreviation, r.partyName),
        });
      });
    } catch (err: any) {
      logger.warn(`Party breakdown query error: ${err.message}`);
    }

    // 4. Booth Infrastructure & Cadre Volunteers
    let totalBooths = 0;
    let assignedBoothsCount = 0;
    try {
      const boothsCountRes = await tenantPool.query(`SELECT COUNT(*)::int as total FROM booths`);
      totalBooths = boothsCountRes.rows[0]?.total || 0;
      const assignedRes = await tenantPool.query(
        `SELECT COUNT(DISTINCT booth_id)::int as total FROM voters WHERE booth_id IS NOT NULL`
      );
      assignedBoothsCount = assignedRes.rows[0]?.total || 0;
    } catch {
      const distBoothRes = await tenantPool.query(
        `SELECT COUNT(DISTINCT booth_id)::int as total FROM voters WHERE booth_id IS NOT NULL`
      );
      totalBooths = distBoothRes.rows[0]?.total || 0;
      assignedBoothsCount = totalBooths;
    }

    let totalVolunteers = 0;
    try {
      const volunteersCountRes = await tenantPool.query(
        `SELECT COUNT(*)::int as total FROM tenant_users WHERE role IN ('pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter')`
      );
      totalVolunteers = volunteersCountRes.rows[0]?.total || 0;
    } catch {
      totalVolunteers = 0;
    }

    // 5. AC Breakdown
    let acBreakdown: Array<{ acId: string; acName: string; voterCount: number }> = [];
    try {
      const acRes = await tenantPool.query(`
        SELECT v.ac_id as "acId", COALESCE(a.name, v.ac_id::text) as "acName", COUNT(*)::int as "voterCount"
        FROM voters v
        LEFT JOIN assembly_constituencies a ON a.id = v.ac_id
        GROUP BY v.ac_id, a.name
        ORDER BY "voterCount" DESC
      `);
      acBreakdown = acRes.rows.map((r: any) => ({
        acId: String(r.acId || ''),
        acName: r.acName || 'Unassigned AC',
        voterCount: parseInt(r.voterCount, 10),
      }));
    } catch {
      acBreakdown = [];
    }

    // 6. Booth Coverage by Volunteer Role
    const boothCoverageByRole: BoothCoverageByRoleItem[] = [];
    try {
      const roleCoverageRes = await tenantPool.query(`
        SELECT 
          r.role_key as "role",
          r.role_name as "roleName",
          COALESCE(stats.volunteer_count, 0)::int as "volunteerCount",
          COALESCE(stats.covered_booths_count, 0)::int as "coveredBoothsCount"
        FROM (
          VALUES 
            ('pc_leader', 'PC Leader', 1),
            ('ac_leader', 'AC Leader', 2),
            ('sub_leader', 'Sub-Leader', 3),
            ('supporter', 'Supporter / Volunteer', 4)
        ) AS r(role_key, role_name, sort_order)
        LEFT JOIN (
          SELECT 
            tu.role,
            COUNT(DISTINCT tu.id)::int as volunteer_count,
            COUNT(DISTINCT uba.booth_id)::int as covered_booths_count
          FROM tenant_users tu
          LEFT JOIN user_booth_assignments uba ON uba.user_id = tu.id
          WHERE tu.role IN ('pc_leader', 'ac_leader', 'sub_leader', 'supporter')
          GROUP BY tu.role
        ) stats ON stats.role = r.role_key
        ORDER BY r.sort_order ASC
      `);
      roleCoverageRes.rows.forEach((r: any) => {
        boothCoverageByRole.push({
          role: r.role,
          roleName: r.roleName,
          volunteerCount: parseInt(r.volunteerCount, 10) || 0,
          coveredBoothsCount: parseInt(r.coveredBoothsCount, 10) || 0,
        });
      });
    } catch (err: any) {
      logger.warn(`Booth coverage by role query error: ${err.message}`);
    }

    const now = new Date().toISOString();

    // 7. UPSERT into tenant_dashboard_stats Rollup Table
    try {
      await tenantPool.query(
        `
        INSERT INTO tenant_dashboard_stats (
          tenant_db_name,
          total_voters,
          total_booths,
          assigned_booths_count,
          total_volunteers,
          gender_breakdown,
          party_breakdown,
          age_cohorts,
          registration_velocity,
          ac_breakdown,
          booth_coverage_by_role,
          last_synced_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
        ON CONFLICT (tenant_db_name) DO UPDATE SET
          total_voters = EXCLUDED.total_voters,
          total_booths = EXCLUDED.total_booths,
          assigned_booths_count = EXCLUDED.assigned_booths_count,
          total_volunteers = EXCLUDED.total_volunteers,
          gender_breakdown = EXCLUDED.gender_breakdown,
          party_breakdown = EXCLUDED.party_breakdown,
          age_cohorts = EXCLUDED.age_cohorts,
          registration_velocity = EXCLUDED.registration_velocity,
          ac_breakdown = EXCLUDED.ac_breakdown,
          booth_coverage_by_role = EXCLUDED.booth_coverage_by_role,
          last_synced_at = EXCLUDED.last_synced_at,
          updated_at = EXCLUDED.updated_at
        `,
        [
          tenantDbName,
          totalVoters,
          totalBooths,
          assignedBoothsCount,
          totalVolunteers,
          JSON.stringify(genderBreakdown),
          JSON.stringify(partyBreakdown),
          JSON.stringify(ageCohorts),
          JSON.stringify(registrationVelocity),
          JSON.stringify(acBreakdown),
          JSON.stringify(boothCoverageByRole),
          now,
        ]
      );
    } catch (err: any) {
      logger.error(`Failed to upsert tenant_dashboard_stats: ${err.message}`);
    }

    // 8. Recent 5 Voters
    const recentVoters = await this.getRecentVoters(tenantPool);

    const fullPayload: TenantDashboardStats = {
      tenantDbName,
      totalVoters,
      totalBooths,
      totalVolunteers,
      assignedBoothsCount,
      genderBreakdown,
      partyBreakdown,
      ageCohorts,
      registrationVelocity,
      acBreakdown,
      boothCoverageByRole,
      recentVoters,
      lastSyncedAt: now,
    };

    // Clear cache key so next read fetches freshly computed payload
    await CacheService.del(`ranniti:tenant:stats:${tenantDbName}`);

    return fullPayload;
  }

  /**
   * Helper to retrieve latest 5 voters efficiently
   */
  private static async getRecentVoters(tenantPool: any) {
    try {
      const rvRes = await tenantPool.query(`
        SELECT v.id, v.epic_no as "epicNo",
               TRIM(CONCAT(COALESCE(v.eng_first_name, v.first_name, ''), ' ', COALESCE(v.eng_surname, v.surname, ''))) as name,
               COALESCE(v.gender, 'M') as gender, COALESCE(v.age, 0) as age,
               v.party_id as "partyId", p.name as "partyName",
               v.created_at as "createdAt"
        FROM voters v
        LEFT JOIN parties p ON p.id = v.party_id
        ORDER BY v.created_at DESC
        LIMIT 5
      `);
      return rvRes.rows.map((r: any) => ({
        id: String(r.id),
        epicNo: r.epicNo || '',
        name: r.name?.trim() || 'Voter Record',
        gender: r.gender || 'M',
        age: parseInt(r.age, 10) || 0,
        partyId: r.partyId || undefined,
        partyName: r.partyName || undefined,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Invalidate Dashboard Cache Key
   */
  static async invalidateCache(tenantDbName: string): Promise<void> {
    if (tenantDbName) {
      await CacheService.del(`ranniti:tenant:stats:${tenantDbName}`);
    }
  }
}
