import path from 'path';
import ExcelJS from 'exceljs';
import { logger } from '../../utils/logger';
import { Voter } from '../../models/voter.model';
import { query as mainQuery } from '../../queries/dbPool';
import { settingsQueries } from '../../queries/settings.queries';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { DEFAULT_SURVEY_FIELD_POINTS, SurveyFieldPointsConfig } from '../../config/surveyScoreWeights';

const FIELD_MAP: Record<string, keyof Voter> = {
  mobile_no: 'mobileNo',
  email: 'email',
  party_id: 'partyId',
  is_family_influencer: 'isFamilyInfluencer',
  is_social_influencer: 'isSocialInfluencer',
  caste_id: 'casteId',
  subcaste_name: 'subcasteName',
  religion_id: 'religionId',
  profession: 'profession',
  status: 'status',
  is_dead: 'isDead',
  dob: 'dob',
  full_address: 'fullAddress',
  blood_group: 'bloodGroup',
  aadhaar_no: 'aadhaarNo',
  pan_no: 'panNo',
};

export interface VolunteerLeaderboardEntry {
  rank: number;
  volunteerId: string;
  name: string;
  mobile: string;
  avatar: string | null;
  role: string;
  totalScore: number;
  votersSurveyed: number;
  fieldsUpdated: number;
  contactPoints: number;
  politicalPoints: number;
  demographicPoints: number;
  statusPoints: number;
  lastActiveAt: string | null;
}

export interface SurveyAuditFeedItem {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerMobile: string;
  volunteerAvatar: string | null;
  voterId: string;
  voterEpicNo: string;
  voterName: string;
  boothId: string | null;
  boothName?: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  pointsAwarded: number;
  createdAt: string;
}

export interface SurveyScoringFilters {
  timeRange?: 'today' | '7d' | '30d' | 'all';
  boothId?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class SurveyScoringService {
  /**
   * Helper to run queries in Tenant DB or fallback to Master DB
   */
  private static async executeQuery(sql: string, params: any[] = [], tenantDbName?: string | null) {
    if (tenantDbName && tenantDbName.trim()) {
      return await TenantPoolManager.query(tenantDbName.trim(), sql, params);
    }
    return await mainQuery(sql, params);
  }

  /**
   * Compare old voter and updated voter to record field updates and award gamification points
   */
  static async recordVoterFieldUpdates(options: {
    volunteerId: string;
    voterId: string;
    boothId?: string | null;
    oldVoter: Voter;
    updatedVoter: Voter;
    tenantDbName?: string | null;
  }): Promise<number> {
    const { volunteerId, voterId, boothId, oldVoter, updatedVoter, tenantDbName } = options;

    if (!volunteerId || !voterId || !oldVoter || !updatedVoter) {
      return 0;
    }

    try {
      // Survey score point rules are centrally managed by Super Admin in Master DB
      const pointsConfig: SurveyFieldPointsConfig = await settingsQueries.getSurveyFieldPoints(null);
      let totalAwardedForThisUpdate = 0;
      const insertRows: Array<{
        fieldName: string;
        oldValue: string | null;
        newValue: string | null;
        points: number;
      }> = [];

      for (const [dbField, voterProp] of Object.entries(FIELD_MAP)) {
        const rule = pointsConfig[dbField] || DEFAULT_SURVEY_FIELD_POINTS[dbField];
        if (!rule || !rule.enabled) continue;

        const oldRaw = oldVoter[voterProp];
        const newRaw = updatedVoter[voterProp];

        const oldStr = oldRaw !== undefined && oldRaw !== null ? String(oldRaw).trim() : '';
        const newStr = newRaw !== undefined && newRaw !== null ? String(newRaw).trim() : '';

        // If no change occurred, ignore
        if (oldStr === newStr) continue;

        // If rule requires the field to have previously been empty
        let points = rule.points;
        if (rule.requirePreviouslyEmpty && oldStr !== '') {
          points = 0; // Existing value was replaced; award 0 points to prevent point farming
        }

        insertRows.push({
          fieldName: dbField,
          oldValue: oldStr || null,
          newValue: newStr || null,
          points,
        });

        totalAwardedForThisUpdate += points;
      }

      if (insertRows.length === 0) {
        return 0;
      }

      // Batch insert into volunteer_field_updates
      const valuesSql: string[] = [];
      const queryParams: any[] = [];
      let paramIdx = 1;

      for (const row of insertRows) {
        valuesSql.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6})`);
        queryParams.push(
          volunteerId,
          voterId,
          boothId || null,
          row.fieldName,
          row.oldValue,
          row.newValue,
          row.points
        );
        paramIdx += 7;
      }

      const sql = `
        INSERT INTO volunteer_field_updates (
          volunteer_id, voter_id, booth_id, field_name, old_value, new_value, points_awarded
        ) VALUES ${valuesSql.join(', ')}
      `;

      await this.executeQuery(sql, queryParams, tenantDbName);
      logger.info(`[SurveyScoringService] Recorded ${insertRows.length} field updates for volunteer '${volunteerId}', voter '${voterId}'. Total points: +${totalAwardedForThisUpdate}`);
      return totalAwardedForThisUpdate;
    } catch (err: any) {
      logger.error(`[SurveyScoringService] Error recording voter field updates: ${err.message}`, err);
      return 0;
    }
  }

  /**
   * Get volunteer survey leaderboard with score breakdown
   */
  static async getLeaderboard(
    filters: SurveyScoringFilters = {},
    tenantDbName?: string | null
  ): Promise<{ leaderboard: VolunteerLeaderboardEntry[]; totalCount: number }> {
    const timeRange = filters.timeRange || '30d';

    let timeFilter = '';
    if (timeRange === 'today') {
      timeFilter = "AND vfu.created_at >= CURRENT_DATE";
    } else if (timeRange === '7d') {
      timeFilter = "AND vfu.created_at >= NOW() - INTERVAL '7 days'";
    } else if (timeRange === '30d') {
      timeFilter = "AND vfu.created_at >= NOW() - INTERVAL '30 days'";
    }

    const whereConditions: string[] = ["u.status = 'active'"];
    const params: any[] = [];
    let pIdx = 1;

    if (filters.role && filters.role !== 'all') {
      whereConditions.push(`u.role = $${pIdx}`);
      params.push(filters.role);
      pIdx++;
    }

    if (filters.boothId && filters.boothId !== 'all') {
      whereConditions.push(`EXISTS (SELECT 1 FROM user_booth_assignments uba WHERE uba.user_id = u.id AND uba.booth_id = $${pIdx}::uuid)`);
      params.push(filters.boothId);
      pIdx++;
    }

    if (filters.search && filters.search.trim()) {
      whereConditions.push(`(u.name ILIKE $${pIdx} OR u.mobile ILIKE $${pIdx})`);
      params.push(`%${filters.search.trim()}%`);
      pIdx++;
    }

    const whereClause = whereConditions.join(' AND ');

    const sql = `
      WITH volunteer_scores AS (
        SELECT
          vfu.volunteer_id,
          COALESCE(SUM(vfu.points_awarded), 0) AS total_score,
          COUNT(DISTINCT vfu.voter_id) AS voters_surveyed,
          COUNT(vfu.id) AS fields_updated,
          COALESCE(SUM(CASE WHEN vfu.field_name IN ('mobile_no', 'email') THEN vfu.points_awarded ELSE 0 END), 0) AS contact_points,
          COALESCE(SUM(CASE WHEN vfu.field_name IN ('party_id', 'is_family_influencer', 'is_social_influencer') THEN vfu.points_awarded ELSE 0 END), 0) AS political_points,
          COALESCE(SUM(CASE WHEN vfu.field_name IN ('caste_id', 'subcaste_name', 'religion_id', 'profession', 'dob') THEN vfu.points_awarded ELSE 0 END), 0) AS demographic_points,
          COALESCE(SUM(CASE WHEN vfu.field_name IN ('status', 'is_dead', 'full_address', 'blood_group', 'aadhaar_no', 'pan_no') THEN vfu.points_awarded ELSE 0 END), 0) AS status_points,
          MAX(vfu.created_at) AS last_active_at
        FROM volunteer_field_updates vfu
        WHERE 1=1 ${timeFilter}
        GROUP BY vfu.volunteer_id
      )
      SELECT
        u.id AS "volunteerId",
        u.name,
        u.mobile,
        u.avatar,
        u.role,
        COALESCE(vs.total_score, 0)::int AS "totalScore",
        COALESCE(vs.voters_surveyed, 0)::int AS "votersSurveyed",
        COALESCE(vs.fields_updated, 0)::int AS "fieldsUpdated",
        COALESCE(vs.contact_points, 0)::int AS "contactPoints",
        COALESCE(vs.political_points, 0)::int AS "politicalPoints",
        COALESCE(vs.demographic_points, 0)::int AS "demographicPoints",
        COALESCE(vs.status_points, 0)::int AS "statusPoints",
        vs.last_active_at AS "lastActiveAt"
      FROM tenant_users u
      LEFT JOIN volunteer_scores vs ON vs.volunteer_id = u.id
      WHERE ${whereClause}
      ORDER BY "totalScore" DESC, "votersSurveyed" DESC, u.name ASC
    `;

    const res = await this.executeQuery(sql, params, tenantDbName);
    const rows = res.rows.map((row: any, idx: number) => ({
      rank: idx + 1,
      volunteerId: row.volunteerId,
      name: row.name,
      mobile: row.mobile,
      avatar: row.avatar,
      role: row.role,
      totalScore: row.totalScore,
      votersSurveyed: row.votersSurveyed,
      fieldsUpdated: row.fieldsUpdated,
      contactPoints: row.contactPoints,
      politicalPoints: row.politicalPoints,
      demographicPoints: row.demographicPoints,
      statusPoints: row.statusPoints,
      lastActiveAt: row.lastActiveAt,
    }));

    return {
      leaderboard: rows,
      totalCount: rows.length,
    };
  }

  /**
   * Get single volunteer survey breakdown and recent activity
   */
  static async getVolunteerStats(
    volunteerId: string,
    tenantDbName?: string | null
  ): Promise<{
    volunteer: any;
    summary: {
      totalScore: number;
      votersSurveyed: number;
      fieldsUpdated: number;
      contactPoints: number;
      politicalPoints: number;
      demographicPoints: number;
      statusPoints: number;
    };
    fieldCounts: Record<string, number>;
  }> {
    const userRes = await this.executeQuery(
      `SELECT id, name, mobile, avatar, role, status FROM tenant_users WHERE id = $1`,
      [volunteerId],
      tenantDbName
    );

    const volunteer = userRes.rows[0] || null;

    const statsRes = await this.executeQuery(
      `SELECT
        COALESCE(SUM(points_awarded), 0)::int AS "totalScore",
        COUNT(DISTINCT voter_id)::int AS "votersSurveyed",
        COUNT(*)::int AS "fieldsUpdated",
        COALESCE(SUM(CASE WHEN field_name IN ('mobile_no', 'email') THEN points_awarded ELSE 0 END), 0)::int AS "contactPoints",
        COALESCE(SUM(CASE WHEN field_name IN ('party_id', 'is_family_influencer', 'is_social_influencer') THEN points_awarded ELSE 0 END), 0)::int AS "politicalPoints",
        COALESCE(SUM(CASE WHEN field_name IN ('caste_id', 'subcaste_name', 'religion_id', 'profession', 'dob') THEN points_awarded ELSE 0 END), 0)::int AS "demographicPoints",
        COALESCE(SUM(CASE WHEN field_name IN ('status', 'is_dead', 'full_address', 'blood_group', 'aadhaar_no', 'pan_no') THEN points_awarded ELSE 0 END), 0)::int AS "statusPoints"
      FROM volunteer_field_updates
      WHERE volunteer_id = $1`,
      [volunteerId],
      tenantDbName
    );

    const fieldCountsRes = await this.executeQuery(
      `SELECT field_name, COUNT(*)::int as count
       FROM volunteer_field_updates
       WHERE volunteer_id = $1
       GROUP BY field_name`,
      [volunteerId],
      tenantDbName
    );

    const fieldCounts: Record<string, number> = {};
    for (const row of fieldCountsRes.rows) {
      fieldCounts[row.field_name] = row.count;
    }

    return {
      volunteer,
      summary: statsRes.rows[0] || {
        totalScore: 0,
        votersSurveyed: 0,
        fieldsUpdated: 0,
        contactPoints: 0,
        politicalPoints: 0,
        demographicPoints: 0,
        statusPoints: 0,
      },
      fieldCounts,
    };
  }

  /**
   * Get paginated audit feed of voter field updates
   */
  static async getAuditFeed(
    filters: SurveyScoringFilters = {},
    tenantDbName?: string | null
  ): Promise<{ items: SurveyAuditFeedItem[]; totalCount: number; page: number; limit: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = ['1=1'];
    const params: any[] = [];
    let pIdx = 1;

    if (filters.boothId && filters.boothId !== 'all') {
      whereConditions.push(`vfu.booth_id = $${pIdx}::uuid`);
      params.push(filters.boothId);
      pIdx++;
    }

    if (filters.search && filters.search.trim()) {
      whereConditions.push(`(u.name ILIKE $${pIdx} OR v.first_name ILIKE $${pIdx} OR v.epic_no ILIKE $${pIdx})`);
      params.push(`%${filters.search.trim()}%`);
      pIdx++;
    }

    const whereClause = whereConditions.join(' AND ');

    const countSql = `
      SELECT COUNT(vfu.id) as total
      FROM volunteer_field_updates vfu
      JOIN tenant_users u ON u.id = vfu.volunteer_id
      JOIN voters v ON v.id = vfu.voter_id
      WHERE ${whereClause}
    `;

    const countRes = await this.executeQuery(countSql, params, tenantDbName);
    const totalCount = parseInt(countRes.rows[0]?.total || '0', 10);

    const dataSql = `
      SELECT
        vfu.id,
        vfu.volunteer_id AS "volunteerId",
        u.name AS "volunteerName",
        u.mobile AS "volunteerMobile",
        u.avatar AS "volunteerAvatar",
        vfu.voter_id AS "voterId",
        v.epic_no AS "voterEpicNo",
        CONCAT(v.first_name, ' ', COALESCE(v.surname, '')) AS "voterName",
        vfu.booth_id AS "boothId",
        b.booth_name AS "boothName",
        vfu.field_name AS "fieldName",
        vfu.old_value AS "oldValue",
        vfu.new_value AS "newValue",
        vfu.points_awarded AS "pointsAwarded",
        vfu.created_at AS "createdAt"
      FROM volunteer_field_updates vfu
      JOIN tenant_users u ON u.id = vfu.volunteer_id
      JOIN voters v ON v.id = vfu.voter_id
      LEFT JOIN booths b ON b.id = vfu.booth_id
      WHERE ${whereClause}
      ORDER BY vfu.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const dataRes = await this.executeQuery(dataSql, [...params, limit, offset], tenantDbName);
    const pointsConfig = await settingsQueries.getSurveyFieldPoints(null);

    const items: SurveyAuditFeedItem[] = dataRes.rows.map((row: any) => ({
      id: row.id,
      volunteerId: row.volunteerId,
      volunteerName: row.volunteerName,
      volunteerMobile: row.volunteerMobile,
      volunteerAvatar: row.volunteerAvatar,
      voterId: row.voterId,
      voterEpicNo: row.voterEpicNo,
      voterName: (row.voterName || '').trim(),
      boothId: row.boothId,
      boothName: row.boothName,
      fieldName: row.fieldName,
      fieldLabel: pointsConfig[row.fieldName]?.label || row.fieldName,
      oldValue: row.oldValue,
      newValue: row.newValue,
      pointsAwarded: row.pointsAwarded,
      createdAt: row.createdAt,
    }));

    return {
      items,
      totalCount,
      page,
      limit,
    };
  }

  /**
   * Export Volunteer Survey Leaderboard to .xlsx per Rule 22
   */
  static async exportSurveyLeaderboardToXlsx(
    filters: SurveyScoringFilters = {},
    tenantDbName?: string | null
  ): Promise<string> {
    const { leaderboard } = await this.getLeaderboard(filters, tenantDbName);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ranniti Platform';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Volunteer Survey Leaderboard', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Volunteer Name', key: 'name', width: 25 },
      { header: 'Mobile Number', key: 'mobile', width: 18 },
      { header: 'Role', key: 'role', width: 18 },
      { header: 'Total Score (Points)', key: 'totalScore', width: 20 },
      { header: 'Voters Surveyed', key: 'votersSurveyed', width: 18 },
      { header: 'Fields Updated', key: 'fieldsUpdated', width: 16 },
      { header: 'Contact Points', key: 'contactPoints', width: 16 },
      { header: 'Political Points', key: 'politicalPoints', width: 16 },
      { header: 'Demographic Points', key: 'demographicPoints', width: 20 },
      { header: 'Status Points', key: 'statusPoints', width: 16 },
      { header: 'Last Active At', key: 'lastActiveAt', width: 22 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };

    leaderboard.forEach((item) => {
      sheet.addRow({
        rank: item.rank,
        name: item.name,
        mobile: item.mobile,
        role: item.role,
        totalScore: item.totalScore,
        votersSurveyed: item.votersSurveyed,
        fieldsUpdated: item.fieldsUpdated,
        contactPoints: item.contactPoints,
        politicalPoints: item.politicalPoints,
        demographicPoints: item.demographicPoints,
        statusPoints: item.statusPoints,
        lastActiveAt: item.lastActiveAt ? new Date(item.lastActiveAt).toLocaleString() : 'N/A',
      });
    });

    const exportFileName = `volunteer_survey_leaderboard_${Date.now()}.xlsx`;
    const exportPath = path.join(process.cwd(), 'xlsx', exportFileName);
    await workbook.xlsx.writeFile(exportPath);
    return exportPath;
  }
}
