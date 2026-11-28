import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../cache.service';
import { TenantPoolManager } from '../pool/tenantPoolManager';

export interface AgePartyCohortItem {
  ageGroup: string;
  label: string;
  total: number;
  parties: Array<{
    partyId: string | null;
    partyName: string;
    color: string;
    count: number;
  }>;
}

export interface FieldCompletenessItem {
  key: string;
  label: string;
  category: 'contact' | 'political' | 'demographic' | 'household';
  filledCount: number;
  totalCount: number;
  percentage: number;
  hint: string;
}

export interface FieldCompletenessStats {
  totalVoters: number;
  overallScore: number;
  fields: FieldCompletenessItem[];
}

export interface CadreSummaryStats {
  subLeaderCount: number;
  supporterCount: number;
  fullyStaffedBooths: number;
  partiallyStaffedBooths: number;
  unstaffedBooths: number;
  totalBooths: number;
  boothTeamMembers?: Array<{
    id: string;
    name: string;
    phone?: string;
    role: string;
  }>;
}

export interface TenantDashboardOverview {
  tenantDbName: string;
  boothId: string | null;
  totalVoters: number;
  totalBooths: number;
  genderBreakdown: { male: number; female: number; other: number };
  genderPhoneReach: { maleWithPhone: number; femaleWithPhone: number; otherWithPhone: number };
  partyBreakdown: Array<{ partyId: string | null; partyName: string; count: number; color: string }>;
  agePartyBreakdown: AgePartyCohortItem[];
  fieldCompleteness: FieldCompletenessStats;
  cadreSummary: CadreSummaryStats;
  constituencies?: {
    parliamentaryConstituencies: Array<{
      id: string;
      name: string;
      pcNumber?: number;
      stateName?: string;
    }>;
    assemblyConstituencies: Array<{
      id: string;
      name: string;
      acNumber?: number;
      pcName?: string;
      stateName?: string;
    }>;
  };
  lastSyncedAt: string;
}

const getPartyPaletteColor = (abbr?: string, name?: string): string => {
  const text = (abbr || name || '').toUpperCase();
  if (text.includes('BJP')) return '#FF9933';
  if (text.includes('INC') || text.includes('CONGRESS')) return '#06B6D4';
  if (text.includes('AAP')) return '#10B981';
  if (text.includes('SHS') || text.includes('SHIV')) return '#F97316';
  if (text.includes('NCP')) return '#3B82F6';
  if (text.includes('BSP')) return '#2563EB';
  if (text.includes('CPI') || text.includes('COMMUNIST')) return '#DC2626';
  if (text.includes('SP') || text.includes('SAMAJWADI')) return '#EF4444';
  if (text.includes('IND') || text.includes('INDEPENDENT')) return '#8B5CF6';
  return '#94A3B8';
};

export class TenantDashboardOverviewService {
  private static CACHE_TTL_SECONDS = 300; // 5 minutes

  static async getOverview(
    tenantDbName: string,
    forceRefresh = false,
    boothId?: string
  ): Promise<TenantDashboardOverview> {
    if (!tenantDbName) {
      throw ApiError.badRequest('No tenant database is assigned to this account');
    }

    const cleanBoothId = boothId && boothId.trim() ? boothId.trim() : undefined;
    const cacheKey = cleanBoothId
      ? `ranniti:tenant:overview:${tenantDbName}:booth:${cleanBoothId}`
      : `ranniti:tenant:overview:${tenantDbName}`;

    if (forceRefresh) {
      await CacheService.del(cacheKey);
    }

    return await CacheService.getOrSet(cacheKey, this.CACHE_TTL_SECONDS, async () => {
      return await this.computeOverview(tenantDbName, cleanBoothId);
    });
  }

  private static async computeOverview(
    tenantDbName: string,
    boothId?: string
  ): Promise<TenantDashboardOverview> {
    const tenantPool = TenantPoolManager.getPool(tenantDbName);
    const voterParams: any[] = boothId ? [boothId] : [];
    const voterWhere = boothId ? `WHERE v.booth_id = $1` : ``;
    const simpleVoterWhere = boothId ? `WHERE booth_id = $1` : ``;

    // 1. Single-Pass Aggregation: Voters, Gender, Phone Reach, and Important Field Completeness
    let totalVoters = 0;
    const genderBreakdown = { male: 0, female: 0, other: 0 };
    const genderPhoneReach = { maleWithPhone: 0, femaleWithPhone: 0, otherWithPhone: 0 };
    let fieldCounts = {
      mobile: 0,
      party: 0,
      caste: 0,
      religion: 0,
      family: 0,
      houseNo: 0,
      profession: 0,
      influencer: 0,
    };

    try {
      const singlePassRes = await tenantPool.query(
        `
        SELECT
          COUNT(*)::int AS "totalVoters",
          COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) IN ('m', 'male'))::int AS "maleVoters",
          COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) IN ('f', 'female'))::int AS "femaleVoters",
          COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) NOT IN ('m', 'male', 'f', 'female'))::int AS "otherVoters",

          COUNT(*) FILTER (
            WHERE LOWER(COALESCE(gender, '')) IN ('m', 'male')
            AND mobile_no IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_no, '\\D', '', 'g')) >= 10
          )::int AS "maleWithPhone",
          COUNT(*) FILTER (
            WHERE LOWER(COALESCE(gender, '')) IN ('f', 'female')
            AND mobile_no IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_no, '\\D', '', 'g')) >= 10
          )::int AS "femaleWithPhone",
          COUNT(*) FILTER (
            WHERE LOWER(COALESCE(gender, '')) NOT IN ('m', 'male', 'f', 'female')
            AND mobile_no IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_no, '\\D', '', 'g')) >= 10
          )::int AS "otherWithPhone",

          COUNT(*) FILTER (WHERE mobile_no IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile_no, '\\D', '', 'g')) >= 10)::int AS "mobileFilled",
          COUNT(*) FILTER (WHERE party_id IS NOT NULL)::int AS "partyFilled",
          COUNT(*) FILTER (WHERE caste_id IS NOT NULL)::int AS "casteFilled",
          COUNT(*) FILTER (WHERE religion_id IS NOT NULL)::int AS "religionFilled",
          COUNT(*) FILTER (WHERE family_id IS NOT NULL AND TRIM(family_id) != '')::int AS "familyFilled",
          COUNT(*) FILTER (WHERE house_no IS NOT NULL AND TRIM(house_no) != '')::int AS "houseNoFilled",
          COUNT(*) FILTER (WHERE profession IS NOT NULL AND TRIM(profession) != '')::int AS "professionFilled",
          COUNT(*) FILTER (WHERE is_family_influencer = TRUE OR family_influencer_id IS NOT NULL OR social_influencer_scope IS NOT NULL OR social_influencer_id IS NOT NULL)::int AS "influencerFilled"
        FROM voters
        ${simpleVoterWhere}
        `,
        voterParams
      );

      const r = singlePassRes.rows[0] || {};
      totalVoters = Number(r.totalVoters || 0);
      genderBreakdown.male = Number(r.maleVoters || 0);
      genderBreakdown.female = Number(r.femaleVoters || 0);
      genderBreakdown.other = Number(r.otherVoters || 0);

      genderPhoneReach.maleWithPhone = Number(r.maleWithPhone || 0);
      genderPhoneReach.femaleWithPhone = Number(r.femaleWithPhone || 0);
      genderPhoneReach.otherWithPhone = Number(r.otherWithPhone || 0);

      fieldCounts = {
        mobile: Number(r.mobileFilled || 0),
        party: Number(r.partyFilled || 0),
        caste: Number(r.casteFilled || 0),
        religion: Number(r.religionFilled || 0),
        family: Number(r.familyFilled || 0),
        houseNo: Number(r.houseNoFilled || 0),
        profession: Number(r.professionFilled || 0),
        influencer: Number(r.influencerFilled || 0),
      };
    } catch (err: any) {
      logger.error(`[Overview] Single-pass aggregation error: ${err.message}`);
    }

    const pct = (count: number) => (totalVoters > 0 ? Math.round((count / totalVoters) * 1000) / 10 : 0);

    const completenessFields: FieldCompletenessItem[] = [
      {
        key: 'mobile_no',
        label: 'Phone Number',
        category: 'contact',
        filledCount: fieldCounts.mobile,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.mobile),
        hint: 'Needed for WhatsApp, SMS & phone calls',
      },
      {
        key: 'party_id',
        label: 'Party Leaning',
        category: 'political',
        filledCount: fieldCounts.party,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.party),
        hint: 'Know who supports you vs undecided voters',
      },
      {
        key: 'caste_id',
        label: 'Caste Details',
        category: 'demographic',
        filledCount: fieldCounts.caste,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.caste),
        hint: 'Helps plan community outreach',
      },
      {
        key: 'family_id',
        label: 'Family Linked',
        category: 'household',
        filledCount: fieldCounts.family,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.family),
        hint: 'Group voters living in the same household',
      },
      {
        key: 'house_no',
        label: 'House Number',
        category: 'household',
        filledCount: fieldCounts.houseNo,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.houseNo),
        hint: 'Helps volunteers find homes door-to-door',
      },
      {
        key: 'religion_id',
        label: 'Religion',
        category: 'demographic',
        filledCount: fieldCounts.religion,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.religion),
        hint: 'Community breakdown for local planning',
      },
      {
        key: 'profession',
        label: 'Profession',
        category: 'demographic',
        filledCount: fieldCounts.profession,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.profession),
        hint: 'Understand farmers, business owners, students & workers',
      },
      {
        key: 'influencer',
        label: 'Family Head',
        category: 'political',
        filledCount: fieldCounts.influencer,
        totalCount: totalVoters,
        percentage: pct(fieldCounts.influencer),
        hint: 'Key decision makers who guide household votes',
      },
    ];

    const weightedScore =
      totalVoters > 0
        ? Math.round(
          (pct(fieldCounts.mobile) * 0.25 +
            pct(fieldCounts.party) * 0.25 +
            pct(fieldCounts.caste) * 0.15 +
            pct(fieldCounts.family) * 0.15 +
            pct(fieldCounts.houseNo) * 0.1 +
            pct(fieldCounts.religion) * 0.05 +
            pct(fieldCounts.profession) * 0.05) *
          10
        ) / 10
        : 0;

    // 2. Party Leaning & Undecided / Swing Voters
    const partyBreakdown: Array<{ partyId: string | null; partyName: string; count: number; color: string }> = [];
    try {
      const partyRes = await tenantPool.query(
        `
        SELECT 
          v.party_id AS "partyId", 
          COALESCE(p.name, 'Undecided Voters') AS "partyName",
          p.abbreviation AS "abbreviation",
          p.color AS "color",
          COUNT(*)::int AS "count"
        FROM voters v
        LEFT JOIN parties p ON p.id = v.party_id
        ${voterWhere}
        GROUP BY v.party_id, p.name, p.abbreviation, p.color
        ORDER BY "count" DESC
        `,
        voterParams
      );
      partyRes.rows.forEach((r: any) => {
        partyBreakdown.push({
          partyId: r.partyId || null,
          partyName: r.partyName,
          count: parseInt(r.count, 10) || 0,
          color: r.partyId ? r.color || getPartyPaletteColor(r.abbreviation, r.partyName) : '#94A3B8',
        });
      });
    } catch (err: any) {
      logger.warn(`[Overview] Party breakdown error: ${err.message}`);
    }

    // 3. Age Cohorts × Party Leaning Cross-Tabulation
    const ageGroupDefinitions = [
      { key: '18-25', label: '18–25 yrs' },
      { key: '26-35', label: '26–35 yrs' },
      { key: '36-50', label: '36–50 yrs' },
      { key: '51-65', label: '51–65 yrs' },
      { key: '65+', label: '65+ yrs' },
    ];
    const agePartyMap: Record<string, AgePartyCohortItem> = {};
    ageGroupDefinitions.forEach((def) => {
      agePartyMap[def.key] = {
        ageGroup: def.key,
        label: def.label,
        total: 0,
        parties: [],
      };
    });

    try {
      const agePartyRes = await tenantPool.query(
        `
        SELECT
          CASE
            WHEN v.age BETWEEN 18 AND 25 THEN '18-25'
            WHEN v.age BETWEEN 26 AND 35 THEN '26-35'
            WHEN v.age BETWEEN 36 AND 50 THEN '36-50'
            WHEN v.age BETWEEN 51 AND 65 THEN '51-65'
            WHEN v.age > 65 THEN '65+'
            ELSE NULL
          END AS "ageGroup",
          v.party_id AS "partyId",
          COALESCE(p.name, 'Undecided') AS "partyName",
          p.abbreviation AS "abbreviation",
          p.color AS "color",
          COUNT(*)::int AS "count"
        FROM voters v
        LEFT JOIN parties p ON p.id = v.party_id
        ${boothId ? 'WHERE v.booth_id = $1 AND v.age >= 18' : 'WHERE v.age >= 18'}
        GROUP BY 1, v.party_id, p.name, p.abbreviation, p.color
        ORDER BY 1 ASC, "count" DESC
        `,
        voterParams
      );

      agePartyRes.rows.forEach((r: any) => {
        if (!r.ageGroup || !agePartyMap[r.ageGroup]) return;
        const count = parseInt(r.count, 10) || 0;
        agePartyMap[r.ageGroup].total += count;
        agePartyMap[r.ageGroup].parties.push({
          partyId: r.partyId || null,
          partyName: r.partyName,
          color: r.partyId ? r.color || getPartyPaletteColor(r.abbreviation, r.partyName) : '#94A3B8',
          count,
        });
      });
    } catch (err: any) {
      logger.warn(`[Overview] Age × Party query error: ${err.message}`);
    }

    const agePartyBreakdown = ageGroupDefinitions.map((def) => agePartyMap[def.key]);

    // 4. Total Booths & Cadre Summary (Booth Sub-Leaders & Supporters)
    let totalBooths = 0;
    try {
      if (boothId) {
        totalBooths = 1;
      } else {
        const boothsCountRes = await tenantPool.query(`SELECT COUNT(*)::int as total FROM booths`);
        totalBooths = boothsCountRes.rows[0]?.total || 0;
      }
    } catch {
      totalBooths = boothId ? 1 : 0;
    }

    const cadreSummary: CadreSummaryStats = {
      subLeaderCount: 0,
      supporterCount: 0,
      fullyStaffedBooths: 0,
      partiallyStaffedBooths: 0,
      unstaffedBooths: totalBooths,
      totalBooths,
    };

    try {
      if (boothId) {
        const scopedCadreRes = await tenantPool.query(
          `
          SELECT tu.id, tu.name, tu.mobile, tu.role
          FROM user_booth_assignments uba
          JOIN tenant_users tu ON tu.id = uba.user_id
          WHERE uba.booth_id = $1
            AND tu.role IN ('pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter')
          ORDER BY
            CASE tu.role
              WHEN 'sub_leader' THEN 1
              WHEN 'supporter' THEN 2
              ELSE 3
            END,
            tu.name ASC
          `,
          [boothId]
        );
        const members = scopedCadreRes.rows || [];
        const subLeaders = members.filter((m: any) => m.role === 'sub_leader').length;
        const supporters = members.filter((m: any) => m.role === 'supporter').length;
        cadreSummary.subLeaderCount = subLeaders;
        cadreSummary.supporterCount = supporters;
        cadreSummary.fullyStaffedBooths = subLeaders >= 1 && supporters >= 1 ? 1 : 0;
        cadreSummary.partiallyStaffedBooths =
          (subLeaders >= 1 || supporters >= 1) && !(subLeaders >= 1 && supporters >= 1) ? 1 : 0;
        cadreSummary.unstaffedBooths = subLeaders === 0 && supporters === 0 ? 1 : 0;
        cadreSummary.boothTeamMembers = members.map((m: any) => ({
          id: String(m.id),
          name: m.name || 'Team Member',
          phone: m.mobile || undefined,
          role: m.role,
        }));
      } else {
        const volunteersCountRes = await tenantPool.query(
          `SELECT
             COUNT(*) FILTER (WHERE role = 'sub_leader')::int as "subLeaders",
             COUNT(*) FILTER (WHERE role = 'supporter')::int as "supporters"
           FROM tenant_users
           WHERE role IN ('sub_leader', 'supporter')`
        );
        const cr = volunteersCountRes.rows[0] || {};
        cadreSummary.subLeaderCount = Number(cr.subLeaders || 0);
        cadreSummary.supporterCount = Number(cr.supporters || 0);

        const boothStaffRes = await tenantPool.query(`
          WITH booth_roles AS (
            SELECT
              b.id AS booth_id,
              COUNT(DISTINCT tu.id) FILTER (WHERE tu.role = 'sub_leader')::int AS sub_leaders,
              COUNT(DISTINCT tu.id) FILTER (WHERE tu.role = 'supporter')::int AS supporters
            FROM booths b
            LEFT JOIN user_booth_assignments uba ON uba.booth_id = b.id
            LEFT JOIN tenant_users tu ON tu.id = uba.user_id
            GROUP BY b.id
          )
          SELECT
            COUNT(*) FILTER (WHERE sub_leaders >= 1 AND supporters >= 1)::int AS "fullyStaffed",
            COUNT(*) FILTER (WHERE (sub_leaders >= 1 OR supporters >= 1) AND NOT (sub_leaders >= 1 AND supporters >= 1))::int AS "partiallyStaffed",
            COUNT(*) FILTER (WHERE sub_leaders = 0 AND supporters = 0)::int AS "unstaffed"
          FROM booth_roles
        `);
        const bsr = boothStaffRes.rows[0] || {};
        cadreSummary.fullyStaffedBooths = Number(bsr.fullyStaffed || 0);
        cadreSummary.partiallyStaffedBooths = Number(bsr.partiallyStaffed || 0);
        cadreSummary.unstaffedBooths = Number(bsr.unstaffed || 0);
      }
    } catch (err: any) {
      logger.warn(`[Overview] Cadre summary query error: ${err.message}`);
    }

    // 5. Assigned Constituencies (PCs & ACs)
    let parliamentaryConstituencies: any[] = [];
    let assemblyConstituencies: any[] = [];
    try {
      const pcRes = await tenantPool.query(`
        SELECT p.id, p.name, p.pc_number as "pcNumber", p.state_id as "stateId", s.name as "stateName"
        FROM parliamentary_constituencies p
        LEFT JOIN states s ON s.id = p.state_id
        ORDER BY p.pc_number ASC
      `);
      parliamentaryConstituencies = pcRes.rows || [];

      const acRes = await tenantPool.query(`
        SELECT a.id, a.name, a.ac_number as "acNumber", a.pc_id as "pcId", pc.name as "pcName",
               a.district_id as "districtId", d.name as "districtName",
               COALESCE(sp.id, sd.id) as "stateId", COALESCE(sp.name, sd.name) as "stateName"
        FROM assembly_constituencies a
        LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
        LEFT JOIN states sp ON pc.state_id = sp.id
        LEFT JOIN districts d ON d.id = a.district_id
        LEFT JOIN states sd ON d.state_id = sd.id
        ORDER BY a.ac_number ASC
      `);
      assemblyConstituencies = acRes.rows || [];
    } catch (err: any) {
      logger.warn(`[Overview] Constituencies query error: ${err.message}`);
    }

    return {
      tenantDbName,
      boothId: boothId || null,
      totalVoters,
      totalBooths,
      genderBreakdown,
      genderPhoneReach,
      partyBreakdown,
      agePartyBreakdown,
      fieldCompleteness: {
        totalVoters,
        overallScore: weightedScore,
        fields: completenessFields,
      },
      cadreSummary,
      constituencies: {
        parliamentaryConstituencies,
        assemblyConstituencies,
      },
      lastSyncedAt: new Date().toISOString(),
    };
  }
}
