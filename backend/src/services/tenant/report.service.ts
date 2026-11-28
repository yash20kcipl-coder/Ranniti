import ExcelJS from 'exceljs';
import { Response } from 'express';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { logger } from '../../utils/logger';
import { volunteerAnalyticsService } from './volunteerAnalytics.service';

export interface VoterSyncReportFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  volunteerId?: string;
  boothId?: string;
  startDate?: string;
  endDate?: string;
}

export interface VoterSyncReportItem {
  id: string;
  voterId: string;
  epicNo: string;
  voterName: string;
  voterEngName: string;
  voterMobile: string | null;
  voterAvatar: string | null;
  gender: string | null;
  age: number | null;
  boothNo: string | null;
  boothName: string | null;
  wardName: string | null;
  acName: string | null;
  volunteerId: string;
  volunteerName: string;
  volunteerMobile: string | null;
  volunteerRole: string;
  volunteerRoleName: string;
  volunteerAvatar: string | null;
  contactName: string | null;
  contactPhone: string | null;
  syncedAt: string;
}

export interface VoterSyncReportResult {
  items: VoterSyncReportItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalSyncedPairs: number;
    uniqueVotersSynced: number;
    activeSyncingVolunteers: number;
  };
}

export interface VotingReportFilters {
  electionId?: string;
  view?: 'booth' | 'voter';
  boothId?: string;
  hasVoted?: 'all' | 'true' | 'false';
  search?: string;
  page?: number;
  limit?: number;
}

export interface VolunteerOutreachVotersFilters {
  volunteerId: string;
  type: 'sync' | 'call' | 'whatsapp';
  timeRange?: '7d' | '30d' | 'all';
  page?: number;
  limit?: number;
}

export class TenantReportService {
  /**
   * Retrieves paginated voter-to-volunteer contact sync records with voter & volunteer details.
   */
  async getVoterSyncReport(
    tenantDbName: string,
    filters: VoterSyncReportFilters = {}
  ): Promise<VoterSyncReportResult> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(`(
        v.epic_no ILIKE $${paramIdx}
        OR v.mobile_no ILIKE $${paramIdx}
        OR CONCAT_WS(' ', v.first_name, v.middle_name, v.surname) ILIKE $${paramIdx}
        OR CONCAT_WS(' ', v.eng_first_name, v.eng_middle_name, v.eng_surname) ILIKE $${paramIdx}
        OR u.name ILIKE $${paramIdx}
        OR u.mobile ILIKE $${paramIdx}
        OR usc.contact_name ILIKE $${paramIdx}
        OR usc.contact_phone ILIKE $${paramIdx}
      )`);
      params.push(q);
      paramIdx++;
    }

    if (filters.role && filters.role.trim() && filters.role !== 'all') {
      conditions.push(`u.role = $${paramIdx}`);
      params.push(filters.role.trim());
      paramIdx++;
    }

    if (filters.volunteerId && filters.volunteerId.trim() && filters.volunteerId !== 'all') {
      conditions.push(`usc.user_id = $${paramIdx}::uuid`);
      params.push(filters.volunteerId.trim());
      paramIdx++;
    }

    if (filters.boothId && filters.boothId.trim() && filters.boothId !== 'all') {
      conditions.push(`v.booth_id = $${paramIdx}::uuid`);
      params.push(filters.boothId.trim());
      paramIdx++;
    }

    if (filters.startDate && filters.startDate.trim()) {
      conditions.push(`usc.synced_at >= $${paramIdx}::timestamptz`);
      params.push(filters.startDate.trim());
      paramIdx++;
    }

    if (filters.endDate && filters.endDate.trim()) {
      conditions.push(`usc.synced_at <= ($${paramIdx}::date + INTERVAL '1 day')`);
      params.push(filters.endDate.trim());
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataSql = `
      SELECT
        usc.id,
        usc.voter_id AS "voterId",
        v.epic_no AS "epicNo",
        TRIM(CONCAT_WS(' ', v.first_name, v.middle_name, v.surname)) AS "voterName",
        TRIM(CONCAT_WS(' ', v.eng_first_name, v.eng_middle_name, v.eng_surname)) AS "voterEngName",
        v.mobile_no AS "voterMobile",
        v.avatar AS "voterAvatar",
        v.gender,
        v.age,
        b.booth_number::text AS "boothNo",
        b.name AS "boothName",
        w.name AS "wardName",
        ac.name AS "acName",
        u.id AS "volunteerId",
        u.name AS "volunteerName",
        u.mobile AS "volunteerMobile",
        u.role AS "volunteerRole",
        COALESCE(u.role_name, u.role) AS "volunteerRoleName",
        u.avatar AS "volunteerAvatar",
        usc.contact_name AS "contactName",
        usc.contact_phone AS "contactPhone",
        usc.synced_at AS "syncedAt"
      FROM user_synced_contacts usc
      INNER JOIN voters v ON v.id = usc.voter_id
      INNER JOIN tenant_users u ON u.id = usc.user_id
      LEFT JOIN booths b ON b.id = v.booth_id
      LEFT JOIN wards w ON w.id = v.ward_id
      LEFT JOIN assembly_constituencies ac ON ac.id = v.ac_id
      ${whereClause}
      ORDER BY usc.synced_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
    `;

    const countAndSummarySql = `
      SELECT
        COUNT(*)::int AS "total",
        COUNT(DISTINCT usc.voter_id)::int AS "uniqueVotersSynced",
        COUNT(DISTINCT usc.user_id)::int AS "activeSyncingVolunteers"
      FROM user_synced_contacts usc
      INNER JOIN voters v ON v.id = usc.voter_id
      INNER JOIN tenant_users u ON u.id = usc.user_id
      ${whereClause};
    `;

    try {
      const [dataRes, summaryRes] = await Promise.all([
        TenantPoolManager.query(tenantDbName, dataSql, [...params, limit, offset]),
        TenantPoolManager.query(tenantDbName, countAndSummarySql, params),
      ]);

      const total = summaryRes.rows[0]?.total || 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        items: dataRes.rows || [],
        total,
        page,
        limit,
        totalPages,
        summary: {
          totalSyncedPairs: total,
          uniqueVotersSynced: summaryRes.rows[0]?.uniqueVotersSynced || 0,
          activeSyncingVolunteers: summaryRes.rows[0]?.activeSyncingVolunteers || 0,
        },
      };
    } catch (err) {
      logger.error(`Error fetching voter sync report for ${tenantDbName}:`, err);
      throw err;
    }
  }

  /**
   * Retrieves election-wise voting & turnout report (booth summary or voter-level status).
   */
  async getVotingReport(tenantDbName: string, filters: VotingReportFilters = {}) {
    const view = filters.view === 'voter' ? 'voter' : 'booth';
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 25));
    const offset = (page - 1) * limit;

    try {
      // 1. Resolve target election (specified or default or latest)
      let electionRow: any = null;
      if (filters.electionId && filters.electionId.trim()) {
        const elRes = await TenantPoolManager.query(
          tenantDbName,
          `SELECT id, name, election_code AS "electionCode", election_type AS "electionType",
                  election_date AS "electionDate", status, is_default AS "isDefault",
                  total_voters_snapshot AS "totalVotersSnapshot", target_votes AS "targetVotes"
           FROM elections WHERE id = $1::uuid LIMIT 1`,
          [filters.electionId.trim()]
        );
        electionRow = elRes.rows[0] || null;
      }

      if (!electionRow) {
        const defRes = await TenantPoolManager.query(
          tenantDbName,
          `SELECT id, name, election_code AS "electionCode", election_type AS "electionType",
                  election_date AS "electionDate", status, is_default AS "isDefault",
                  total_voters_snapshot AS "totalVotersSnapshot", target_votes AS "targetVotes"
           FROM elections
           ORDER BY is_default DESC, election_date DESC
           LIMIT 1`
        );
        electionRow = defRes.rows[0] || null;
      }

      if (!electionRow) {
        return {
          election: null,
          summary: {
            totalVoters: 0,
            votedCount: 0,
            notVotedCount: 0,
            turnoutPercentage: 0,
            maleVotedCount: 0,
            femaleVotedCount: 0,
            otherVotedCount: 0,
            totalBooths: 0,
            boothsWithVotes: 0,
          },
          view,
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        };
      }

      const electionId = electionRow.id;

      // 2. Compute summary KPIs from election_booth_turnout, falling back to voters count if cache empty
      const kpiRes = await TenantPoolManager.query(
        tenantDbName,
        `SELECT
           COALESCE(SUM(ebt.total_voters), 0)::int AS "totalVoters",
           COALESCE(SUM(ebt.voted_count), 0)::int AS "votedCount",
           COALESCE(SUM(ebt.male_voted_count), 0)::int AS "maleVotedCount",
           COALESCE(SUM(ebt.female_voted_count), 0)::int AS "femaleVotedCount",
           COALESCE(SUM(ebt.other_voted_count), 0)::int AS "otherVotedCount",
           COUNT(ebt.booth_id)::int AS "cachedBooths",
           COUNT(ebt.booth_id) FILTER (WHERE ebt.voted_count > 0)::int AS "boothsWithVotes"
         FROM election_booth_turnout ebt
         WHERE ebt.election_id = $1::uuid`,
        [electionId]
      );

      let summaryRow = kpiRes.rows[0];
      if (!summaryRow || summaryRow.cachedBooths === 0) {
        const fallbackRes = await TenantPoolManager.query(
          tenantDbName,
          `SELECT
             (SELECT COUNT(*)::int FROM voters WHERE is_dead = false) AS "totalVoters",
             (SELECT COUNT(*)::int FROM voter_election_statuses WHERE election_id = $1::uuid AND has_voted = true) AS "votedCount",
             0::int AS "maleVotedCount",
             0::int AS "femaleVotedCount",
             0::int AS "otherVotedCount",
             (SELECT COUNT(*)::int FROM booths) AS "cachedBooths",
             (SELECT COUNT(DISTINCT booth_id)::int FROM voter_election_statuses WHERE election_id = $1::uuid AND has_voted = true) AS "boothsWithVotes"`,
          [electionId]
        );
        summaryRow = fallbackRes.rows[0];
      }

      const totalBoothsRes = await TenantPoolManager.query(
        tenantDbName,
        `SELECT COUNT(*)::int AS "totalBooths" FROM booths`
      );
      const totalBooths = totalBoothsRes.rows[0]?.totalBooths || summaryRow.cachedBooths || 0;
      const totalVoters = summaryRow.totalVoters || 0;
      const votedCount = summaryRow.votedCount || 0;
      const notVotedCount = Math.max(0, totalVoters - votedCount);
      const turnoutPercentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 1000) / 10 : 0;

      const summary = {
        totalVoters,
        votedCount,
        notVotedCount,
        turnoutPercentage,
        maleVotedCount: summaryRow.maleVotedCount || 0,
        femaleVotedCount: summaryRow.femaleVotedCount || 0,
        otherVotedCount: summaryRow.otherVotedCount || 0,
        totalBooths,
        boothsWithVotes: summaryRow.boothsWithVotes || 0,
      };

      // 3. Query paginated items based on view
      const params: any[] = [electionId];
      let paramIdx = 2;

      if (view === 'booth') {
        const conditions: string[] = [];
        if (filters.search && filters.search.trim()) {
          const q = `%${filters.search.trim()}%`;
          conditions.push(`(b.booth_number::text ILIKE $${paramIdx} OR b.name ILIKE $${paramIdx} OR w.name ILIKE $${paramIdx})`);
          params.push(q);
          paramIdx++;
        }
        if (filters.boothId && filters.boothId.trim() && filters.boothId !== 'all') {
          conditions.push(`b.id = $${paramIdx}::uuid`);
          params.push(filters.boothId.trim());
          paramIdx++;
        }
        if (filters.hasVoted === 'true') {
          conditions.push(`COALESCE(ebt.voted_count, 0) > 0`);
        } else if (filters.hasVoted === 'false') {
          conditions.push(`COALESCE(ebt.voted_count, 0) = 0`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const boothSql = `
          SELECT
            b.id AS "boothId",
            b.booth_number::text AS "boothNo",
            b.name AS "boothName",
            w.name AS "wardName",
            COALESCE(ebt.total_voters, 0)::int AS "totalVoters",
            COALESCE(ebt.voted_count, 0)::int AS "votedCount",
            GREATEST(0, COALESCE(ebt.total_voters, 0) - COALESCE(ebt.voted_count, 0))::int AS "notVotedCount",
            CASE
              WHEN COALESCE(ebt.total_voters, 0) > 0
              THEN ROUND((COALESCE(ebt.voted_count, 0)::numeric / ebt.total_voters::numeric) * 100, 1)::float
              ELSE 0
            END AS "turnoutPercentage",
            COALESCE(ebt.male_voted_count, 0)::int AS "maleVotedCount",
            COALESCE(ebt.female_voted_count, 0)::int AS "femaleVotedCount",
            COALESCE(ebt.other_voted_count, 0)::int AS "otherVotedCount",
            ebt.last_voted_at AS "lastVotedAt"
          FROM booths b
          LEFT JOIN election_booth_turnout ebt ON ebt.booth_id = b.id AND ebt.election_id = $1::uuid
          LEFT JOIN wards w ON w.id = b.ward_id
          ${whereClause}
          ORDER BY "turnoutPercentage" DESC, b.booth_number ASC
          LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
        `;

        const countSql = `
          SELECT COUNT(*)::int AS total
          FROM booths b
          LEFT JOIN election_booth_turnout ebt ON ebt.booth_id = b.id AND ebt.election_id = $1::uuid
          LEFT JOIN wards w ON w.id = b.ward_id
          ${whereClause};
        `;

        const [rowsRes, countRes] = await Promise.all([
          TenantPoolManager.query(tenantDbName, boothSql, [...params, limit, offset]),
          TenantPoolManager.query(tenantDbName, countSql, params),
        ]);

        const total = countRes.rows[0]?.total || 0;
        return {
          election: electionRow,
          summary,
          view,
          items: rowsRes.rows || [],
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        };
      }

      // Voter-level voting status view
      const voterConditions: string[] = ['v.is_dead = false'];
      if (filters.search && filters.search.trim()) {
        const q = `%${filters.search.trim()}%`;
        voterConditions.push(`(
          v.epic_no ILIKE $${paramIdx}
          OR v.mobile_no ILIKE $${paramIdx}
          OR CONCAT_WS(' ', v.first_name, v.middle_name, v.surname) ILIKE $${paramIdx}
          OR CONCAT_WS(' ', v.eng_first_name, v.eng_middle_name, v.eng_surname) ILIKE $${paramIdx}
        )`);
        params.push(q);
        paramIdx++;
      }
      if (filters.boothId && filters.boothId.trim() && filters.boothId !== 'all') {
        voterConditions.push(`v.booth_id = $${paramIdx}::uuid`);
        params.push(filters.boothId.trim());
        paramIdx++;
      }
      if (filters.hasVoted === 'true') {
        voterConditions.push(`COALESCE(ves.has_voted, false) = true`);
      } else if (filters.hasVoted === 'false') {
        voterConditions.push(`COALESCE(ves.has_voted, false) = false`);
      }

      const voterWhereClause = `WHERE ${voterConditions.join(' AND ')}`;

      const voterSql = `
        SELECT
          v.id AS "voterId",
          v.epic_no AS "epicNo",
          TRIM(CONCAT_WS(' ', v.first_name, v.middle_name, v.surname)) AS "voterName",
          TRIM(CONCAT_WS(' ', v.eng_first_name, v.eng_middle_name, v.eng_surname)) AS "voterEngName",
          v.mobile_no AS "voterMobile",
          v.avatar AS "voterAvatar",
          v.gender,
          v.age,
          b.booth_number::text AS "boothNo",
          b.name AS "boothName",
          w.name AS "wardName",
          COALESCE(ves.has_voted, false) AS "hasVoted",
          ves.voted_at AS "votedAt",
          u.name AS "markedByName",
          u.mobile AS "markedByMobile"
        FROM voters v
        LEFT JOIN voter_election_statuses ves ON ves.voter_id = v.id AND ves.election_id = $1::uuid
        LEFT JOIN booths b ON b.id = v.booth_id
        LEFT JOIN wards w ON w.id = v.ward_id
        LEFT JOIN tenant_users u ON u.id = ves.marked_by_user_id
        ${voterWhereClause}
        ORDER BY COALESCE(ves.has_voted, false) DESC, ves.voted_at DESC NULLS LAST, v.serial_no ASC NULLS LAST
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
      `;

      const voterCountSql = `
        SELECT COUNT(*)::int AS total
        FROM voters v
        LEFT JOIN voter_election_statuses ves ON ves.voter_id = v.id AND ves.election_id = $1::uuid
        ${voterWhereClause};
      `;

      const [voterRowsRes, voterCountRes] = await Promise.all([
        TenantPoolManager.query(tenantDbName, voterSql, [...params, limit, offset]),
        TenantPoolManager.query(tenantDbName, voterCountSql, params),
      ]);

      const total = voterCountRes.rows[0]?.total || 0;
      return {
        election: electionRow,
        summary,
        view,
        items: voterRowsRes.rows || [],
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (err) {
      logger.error(`Error fetching voting report for ${tenantDbName}:`, err);
      throw err;
    }
  }

  /**
   * Retrieves paginated voter details for a specific volunteer and outreach action (sync, call, whatsapp).
   */
  async getVolunteerOutreachVoters(
    tenantDbName: string,
    filters: VolunteerOutreachVotersFilters
  ) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 15));
    const offset = (page - 1) * limit;
    const timeRange = filters.timeRange || '30d';

    let timeInterval = '';
    if (timeRange === '7d') {
      timeInterval = "NOW() - INTERVAL '7 days'";
    } else if (timeRange === '30d') {
      timeInterval = "NOW() - INTERVAL '30 days'";
    }

    try {
      if (filters.type === 'sync') {
        const timeClause = timeInterval ? `AND usc.synced_at >= ${timeInterval}` : '';

        const dataSql = `
          SELECT
            usc.id,
            v.id AS "voterId",
            v.epic_no AS "epicNo",
            TRIM(CONCAT_WS(' ', v.first_name, v.middle_name, v.surname)) AS "voterName",
            TRIM(CONCAT_WS(' ', v.eng_first_name, v.eng_middle_name, v.eng_surname)) AS "voterEngName",
            v.mobile_no AS "voterMobile",
            v.avatar AS "voterAvatar",
            v.gender,
            v.age,
            b.booth_number::text AS "boothNo",
            b.name AS "boothName",
            w.name AS "wardName",
            usc.contact_name AS "contactName",
            usc.contact_phone AS "contactPhone",
            usc.synced_at AS "activityAt"
          FROM user_synced_contacts usc
          INNER JOIN voters v ON v.id = usc.voter_id
          LEFT JOIN booths b ON b.id = v.booth_id
          LEFT JOIN wards w ON w.id = v.ward_id
          WHERE usc.user_id = $1::uuid
            ${timeClause}
          ORDER BY usc.synced_at DESC
          LIMIT $2 OFFSET $3;
        `;

        const countSql = `
          SELECT COUNT(*)::int AS total
          FROM user_synced_contacts usc
          WHERE usc.user_id = $1::uuid
            ${timeClause};
        `;

        const [dataRes, countRes] = await Promise.all([
          TenantPoolManager.query(tenantDbName, dataSql, [filters.volunteerId, limit, offset]),
          TenantPoolManager.query(tenantDbName, countSql, [filters.volunteerId]),
        ]);

        const total = countRes.rows[0]?.total || 0;
        return {
          items: dataRes.rows || [],
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        };
      }

      // 'call' or 'whatsapp' from volunteer_activity_logs
      const actTimeClause = timeInterval ? `AND val.created_at >= ${timeInterval}` : '';

      const actDataSql = `
        SELECT
          val.id,
          v.id AS "voterId",
          v.epic_no AS "epicNo",
          TRIM(CONCAT_WS(' ', v.first_name, v.middle_name, v.surname)) AS "voterName",
          TRIM(CONCAT_WS(' ', v.eng_first_name, v.eng_middle_name, v.eng_surname)) AS "voterEngName",
          v.mobile_no AS "voterMobile",
          v.avatar AS "voterAvatar",
          v.gender,
          v.age,
          b.booth_number::text AS "boothNo",
          b.name AS "boothName",
          w.name AS "wardName",
          NULL::text AS "contactName",
          NULL::text AS "contactPhone",
          val.created_at AS "activityAt"
        FROM volunteer_activity_logs val
        LEFT JOIN voters v ON v.id = val.voter_id
        LEFT JOIN booths b ON b.id = COALESCE(val.booth_id, v.booth_id)
        LEFT JOIN wards w ON w.id = v.ward_id
        WHERE val.volunteer_id = $1::uuid
          AND val.activity_type = $2
          ${actTimeClause}
        ORDER BY val.created_at DESC
        LIMIT $3 OFFSET $4;
      `;

      const actCountSql = `
        SELECT COUNT(*)::int AS total
        FROM volunteer_activity_logs val
        WHERE val.volunteer_id = $1::uuid
          AND val.activity_type = $2
          ${actTimeClause};
      `;

      const [actDataRes, actCountRes] = await Promise.all([
        TenantPoolManager.query(tenantDbName, actDataSql, [filters.volunteerId, filters.type, limit, offset]),
        TenantPoolManager.query(tenantDbName, actCountSql, [filters.volunteerId, filters.type]),
      ]);

      const total = actCountRes.rows[0]?.total || 0;
      return {
        items: actDataRes.rows || [],
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (err) {
      logger.error(`Error fetching volunteer outreach voters for ${tenantDbName}:`, err);
      throw err;
    }
  }

  private async streamExcel(
    res: Response,
    filename: string,
    sheetName: string,
    columns: { header: string; key: string; width: number }[],
    rows: Record<string, any>[]
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns;

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };

    for (const row of rows) {
      sheet.addRow(row);
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  }

  async exportVoterSyncExcel(
    tenantDbName: string,
    filters: VoterSyncReportFilters,
    res: Response
  ): Promise<void> {
    const result = await this.getVoterSyncReport(tenantDbName, {
      ...filters,
      page: 1,
      limit: 50000,
    });

    const ROLE_LABELS: Record<string, string> = {
      pc_leader: 'PC Leader',
      ac_leader: 'AC Leader',
      sub_leader: 'Sub-Leader',
      supporter: 'Volunteer',
    };

    const rows = result.items.map((item) => ({
      voterName: item.voterName || item.voterEngName || '',
      voterEngName: item.voterEngName || '',
      epicNo: item.epicNo || '',
      gender: item.gender || '',
      age: item.age ?? '',
      voterMobile: item.voterMobile || '',
      boothNo: item.boothNo || '',
      wardName: item.wardName || '',
      volunteerName: item.volunteerName || '',
      volunteerMobile: item.volunteerMobile || '',
      volunteerRole: ROLE_LABELS[item.volunteerRole] || item.volunteerRoleName || item.volunteerRole,
      syncedAt: item.syncedAt ? new Date(item.syncedAt).toLocaleString('en-IN') : '',
    }));

    await this.streamExcel(
      res,
      'Voter_Sync_Report.xlsx',
      'Voter Sync Report',
      [
        { header: 'Voter Name', key: 'voterName', width: 26 },
        { header: 'English Name', key: 'voterEngName', width: 26 },
        { header: 'EPIC No', key: 'epicNo', width: 16 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Age', key: 'age', width: 8 },
        { header: 'Voter Mobile', key: 'voterMobile', width: 16 },
        { header: 'Booth No', key: 'boothNo', width: 12 },
        { header: 'Ward', key: 'wardName', width: 20 },
        { header: 'Volunteer Name', key: 'volunteerName', width: 24 },
        { header: 'Volunteer Mobile', key: 'volunteerMobile', width: 16 },
        { header: 'Volunteer Role', key: 'volunteerRole', width: 16 },
        { header: 'Synced At', key: 'syncedAt', width: 22 },
      ],
      rows
    );
  }

  async exportVotingReportExcel(
    tenantDbName: string,
    filters: VotingReportFilters,
    res: Response
  ): Promise<void> {
    const result = await this.getVotingReport(tenantDbName, {
      ...filters,
      page: 1,
      limit: 50000,
    });

    if (result.view === 'voter') {
      const rows = (result.items as any[]).map((item) => ({
        voterName: item.voterName || item.voterEngName || '',
        epicNo: item.epicNo || '',
        gender: item.gender || '',
        age: item.age ?? '',
        voterMobile: item.voterMobile || '',
        boothNo: item.boothNo || '',
        wardName: item.wardName || '',
        status: item.hasVoted ? 'Voted' : 'Not Voted',
        votedAt: item.votedAt ? new Date(item.votedAt).toLocaleString('en-IN') : '',
        markedByName: item.markedByName || '',
      }));

      await this.streamExcel(
        res,
        'Voting_Report_Voters.xlsx',
        'Voter Voting Status',
        [
          { header: 'Voter Name', key: 'voterName', width: 26 },
          { header: 'EPIC No', key: 'epicNo', width: 16 },
          { header: 'Gender', key: 'gender', width: 10 },
          { header: 'Age', key: 'age', width: 8 },
          { header: 'Voter Mobile', key: 'voterMobile', width: 16 },
          { header: 'Booth No', key: 'boothNo', width: 12 },
          { header: 'Ward', key: 'wardName', width: 20 },
          { header: 'Status', key: 'status', width: 14 },
          { header: 'Marked At', key: 'votedAt', width: 22 },
          { header: 'Marked By', key: 'markedByName', width: 22 },
        ],
        rows
      );
      return;
    }

    const rows = (result.items as any[]).map((item) => ({
      boothNo: item.boothNo || '',
      boothName: item.boothName || '',
      wardName: item.wardName || '',
      totalVoters: item.totalVoters || 0,
      votedCount: item.votedCount || 0,
      notVotedCount: item.notVotedCount || 0,
      maleVotedCount: item.maleVotedCount || 0,
      femaleVotedCount: item.femaleVotedCount || 0,
      turnoutPercentage: `${item.turnoutPercentage || 0}%`,
    }));

    await this.streamExcel(
      res,
      'Voting_Report_Booths.xlsx',
      'Booth Turnout',
      [
        { header: 'Booth No', key: 'boothNo', width: 12 },
        { header: 'Booth Name', key: 'boothName', width: 30 },
        { header: 'Ward', key: 'wardName', width: 20 },
        { header: 'Total Voters', key: 'totalVoters', width: 14 },
        { header: 'Voted', key: 'votedCount', width: 12 },
        { header: 'Pending', key: 'notVotedCount', width: 12 },
        { header: 'Male Voted', key: 'maleVotedCount', width: 12 },
        { header: 'Female Voted', key: 'femaleVotedCount', width: 14 },
        { header: 'Turnout %', key: 'turnoutPercentage', width: 12 },
      ],
      rows
    );
  }

  async exportVolunteerOutreachExcel(
    tenantDbName: string,
    filters: { timeRange?: '7d' | '30d' | 'all'; role?: string },
    res: Response
  ): Promise<void> {
    const analytics = await volunteerAnalyticsService.getVolunteerAnalytics(tenantDbName, filters);
    const ROLE_LABELS: Record<string, string> = {
      pc_leader: 'PC Leader',
      ac_leader: 'AC Leader',
      sub_leader: 'Sub-Leader',
      supporter: 'Volunteer',
    };

    const rows = analytics.leaderboard.map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      mobile: item.mobile || '',
      role: ROLE_LABELS[item.role] || item.roleName,
      assignedBoothsCount: item.assignedBoothsCount,
      assignedVotersCount: item.assignedVotersCount,
      contactsSynced: item.contactsSynced,
      callsCount: item.callsCount,
      whatsAppCount: item.whatsAppCount,
      totalTouches: item.totalTouches,
      coverage: `${item.engagementScore}%`,
    }));

    await this.streamExcel(
      res,
      'Volunteer_Outreach_Report.xlsx',
      'Volunteer Outreach',
      [
        { header: 'Rank', key: 'rank', width: 8 },
        { header: 'Volunteer Name', key: 'name', width: 24 },
        { header: 'Phone Number', key: 'mobile', width: 16 },
        { header: 'Role', key: 'role', width: 14 },
        { header: 'Assigned Booths', key: 'assignedBoothsCount', width: 16 },
        { header: 'Assigned Voters', key: 'assignedVotersCount', width: 16 },
        { header: 'Contacts Synced', key: 'contactsSynced', width: 16 },
        { header: 'Calls Made', key: 'callsCount', width: 12 },
        { header: 'WhatsApp Sent', key: 'whatsAppCount', width: 14 },
        { header: 'Total Touches', key: 'totalTouches', width: 14 },
        { header: 'Coverage %', key: 'coverage', width: 14 },
      ],
      rows
    );
  }
}

export const tenantReportService = new TenantReportService();
