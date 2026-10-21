import { Pool } from 'pg';
import { query } from './dbPool';
import { electionQueries } from './election.queries';

export interface MobilePollingVoterItem {
  id: string;
  serialNo: number | null;
  epicNo: string;
  name: string;
  engName: string;
  age: number | null;
  gender: string | null;
  houseNo: string | null;
  sectionNo: number | null;
  mobileNo: string | null;
  hasVoted: boolean;
  votedAt: string | null;
}

export interface MobileTurnoutSummary {
  totalVoters: number;
  votedCount: number;
  pendingCount: number;
  turnoutPercentage: number;
  votedMale: number;
  votedFemale: number;
  votedOther: number;
}

export interface MobilePollingVotersResult {
  election: {
    id: string;
    name: string;
    electionDate: string;
    status: string;
  } | null;
  booth: {
    id: string;
    boothNumber: number | null;
    name: string;
  } | null;
  turnoutSummary: MobileTurnoutSummary;
  voters: MobilePollingVoterItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class MobileElectionQueries {
  /**
   * Fast booth-scoped polling voter list (<3ms)
   */
  static async getMobilePollingVoters(
    pool: Pool,
    params: {
      boothId: string;
      electionId?: string;
      search?: string;
      serialNo?: number;
      hasVoted?: 'all' | 'voted' | 'not_voted';
      page?: number;
      limit?: number;
    }
  ): Promise<MobilePollingVotersResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(200, params.limit || 50));
    const offset = (page - 1) * limit;

    // 1. Resolve active election
    let electionId = params.electionId;
    let electionRecord: any = null;

    if (electionId) {
      electionRecord = await electionQueries.getTenantElectionById(pool, electionId);
    } else {
      electionRecord = await electionQueries.resolveDateBasedDefaultElection(pool);
      if (electionRecord) {
        electionId = electionRecord.id;
      }
    }

    // 2. Fetch Booth Details with Ward and AC context
    const boothRes = await pool.query(
      `SELECT 
         b.id, 
         b.booth_number AS "boothNumber", 
         b.name,
         w.ward_number AS "wardNumber",
         w.name AS "wardName",
         ac.name AS "acName"
       FROM booths b
       LEFT JOIN wards w ON w.id = b.ward_id
       LEFT JOIN assembly_constituencies ac ON ac.id = b.ac_id
       WHERE b.id = $1 LIMIT 1;`,
      [params.boothId]
    );
    const booth = boothRes.rows[0] || null;

    // 3. Compute Real-time Turnout Summary for the Booth
    let turnoutSummary: MobileTurnoutSummary = {
      totalVoters: 0,
      votedCount: 0,
      pendingCount: 0,
      turnoutPercentage: 0,
      votedMale: 0,
      votedFemale: 0,
      votedOther: 0,
    };

    if (electionId) {
      const summaryRes = await pool.query(
        `SELECT 
          COUNT(*)::int AS total_voters,
          COUNT(*) FILTER (WHERE ves.has_voted = true)::int AS voted_count,
          COUNT(*) FILTER (WHERE ves.has_voted = true AND v.gender ILIKE 'male')::int AS voted_male,
          COUNT(*) FILTER (WHERE ves.has_voted = true AND v.gender ILIKE 'female')::int AS voted_female,
          COUNT(*) FILTER (WHERE ves.has_voted = true AND v.gender NOT ILIKE 'male' AND v.gender NOT ILIKE 'female')::int AS voted_other
        FROM voters v
        LEFT JOIN voter_election_statuses ves 
          ON ves.voter_id = v.id AND ves.election_id = $1
        WHERE v.booth_id = $2;`,
        [electionId, params.boothId]
      );

      const row = summaryRes.rows[0] || {};
      const totalVoters = row.total_voters || 0;
      const votedCount = row.voted_count || 0;
      const pendingCount = Math.max(0, totalVoters - votedCount);
      const turnoutPercentage = totalVoters > 0 ? parseFloat(((votedCount / totalVoters) * 100).toFixed(2)) : 0;

      turnoutSummary = {
        totalVoters,
        votedCount,
        pendingCount,
        turnoutPercentage,
        votedMale: row.voted_male || 0,
        votedFemale: row.voted_female || 0,
        votedOther: row.voted_other || 0,
      };
    }

    // 4. Query Filtered Voters
    const conditions: string[] = ['v.booth_id = $1'];
    const values: any[] = [params.boothId];
    let paramIdx = 2;

    if (electionId) {
      // Turnout filter
      if (params.hasVoted === 'voted') {
        conditions.push(`ves.has_voted = true`);
      } else if (params.hasVoted === 'not_voted') {
        conditions.push(`(ves.has_voted IS NULL OR ves.has_voted = false)`);
      }
    }

    // Direct serial number lookup
    if (params.serialNo) {
      conditions.push(`v.serial_no = $${paramIdx}`);
      values.push(params.serialNo);
      paramIdx++;
    }

    // Fast search (EPIC exact/prefix, Name prefix)
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      conditions.push(
        `(v.epic_no ILIKE $${paramIdx} OR v.first_name ILIKE $${paramIdx} OR v.eng_first_name ILIKE $${paramIdx} OR v.surname ILIKE $${paramIdx} OR v.eng_surname ILIKE $${paramIdx})`
      );
      values.push(`%${q}%`);
      paramIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total Count
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM voters v
      ${electionId ? `LEFT JOIN voter_election_statuses ves ON ves.voter_id = v.id AND ves.election_id = '${electionId}'` : ''}
      ${whereClause};
    `;
    const countRes = await pool.query(countSql, values);
    const total = countRes.rows[0]?.count || 0;

    // Lean Voter Projection (<3ms)
    const listSql = `
      SELECT 
        v.id,
        v.serial_no AS "serialNo",
        v.epic_no AS "epicNo",
        TRIM(CONCAT_WS(' ', v.first_name, v.middle_name, v.surname)) AS "name",
        TRIM(CONCAT_WS(' ', v.eng_first_name, v.eng_middle_name, v.eng_surname)) AS "engName",
        v.age,
        v.gender,
        v.house_no AS "houseNo",
        v.section_no AS "sectionNo",
        v.mobile_no AS "mobileNo",
        COALESCE(ves.has_voted, false) AS "hasVoted",
        ves.voted_at AS "votedAt"
      FROM voters v
      ${electionId ? `LEFT JOIN voter_election_statuses ves ON ves.voter_id = v.id AND ves.election_id = '${electionId}'` : 'LEFT JOIN (SELECT NULL::uuid AS voter_id, NULL::boolean AS has_voted, NULL::timestamptz AS voted_at) ves ON false'}
      ${whereClause}
      ORDER BY v.serial_no ASC NULLS LAST, v.id ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
    `;
    values.push(limit, offset);

    const listRes = await pool.query(listSql, values);

    return {
      election: electionRecord
        ? {
          id: electionRecord.id,
          name: electionRecord.name,
          electionDate: electionRecord.electionDate,
          status: electionRecord.status,
        }
        : null,
      booth: booth || null,
      turnoutSummary,
      voters: listRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Fast single-tap vote marker for mobile (<3ms)
   */
  static async recordMobileVoterStatus(
    pool: Pool,
    payload: {
      voterId: string;
      electionId?: string;
      boothId?: string;
      hasVoted: boolean;
      markedByUserId?: string;
    }
  ): Promise<any> {
    let electionId = payload.electionId;
    if (!electionId) {
      const def = await electionQueries.resolveDateBasedDefaultElection(pool);
      if (!def) {
        throw new Error('No active election found. Please select an election cycle.');
      }
      electionId = def.id;
    }

    return await electionQueries.recordVoterStatus(pool, {
      electionId,
      voterId: payload.voterId,
      boothId: payload.boothId,
      hasVoted: payload.hasVoted,
      markedByUserId: payload.markedByUserId,
    });
  }

  /**
   * Fast batch-sync for offline mobile queues
   */
  static async batchSyncMobileVoterStatus(
    pool: Pool,
    payload: {
      electionId?: string;
      items: Array<{
        voterId: string;
        boothId?: string;
        hasVoted: boolean;
        votedAt?: string;
      }>;
    }
  ): Promise<any> {
    let electionId = payload.electionId;
    if (!electionId) {
      const def = await electionQueries.resolveDateBasedDefaultElection(pool);
      if (!def) {
        throw new Error('No active election found. Please select an election cycle.');
      }
      electionId = def.id;
    }

    return await electionQueries.batchSyncVoterStatus(pool, electionId, payload.items);
  }

  /**
   * Booth turnout & hourly trend for mobile war room analytics
   */
  static async getMobileBoothTurnout(pool: Pool, electionId: string, boothId: string) {
    const turnout = await electionQueries.getBoothTurnout(pool, electionId, boothId);
    const hourly = await electionQueries.getHourlyTurnoutAnalytics(pool, electionId);

    return {
      boothTurnout: turnout[0] || null,
      hourlySurge: hourly,
    };
  }

  /**
   * Fetch approved WhatsApp templates from Tenant DB combined with election & campaign metadata
   */
  static async getMobileWhatsAppTemplates(tenantPool: Pool): Promise<{
    templates: any[];
    election: { id: string | null; name: string | null; electionDate: string | null };
    campaign: { candidateName: string | null; partyName: string | null };
  }> {
    // 1. Fetch APPROVED templates from Tenant DB
    let templateRows: any[] = [];
    try {
      const tenantTemplatesRes = await tenantPool.query(
        `SELECT id, meta_template_id AS "metaTemplateId", name, category, language,
                header_type AS "headerType", header_content AS "headerContent",
                body_text AS "bodyText", footer_text AS "footerText",
                buttons, variables, meta_status AS "metaStatus"
         FROM whatsapp_templates
         WHERE meta_status = 'APPROVED'
         ORDER BY category ASC, name ASC;`
      );
      templateRows = tenantTemplatesRes.rows;
    } catch {
      templateRows = [];
    }

    // 2. Fetch Active default election from Tenant DB
    let defaultElection = null;
    try {
      defaultElection = await electionQueries.resolveDateBasedDefaultElection(tenantPool);
    } catch {
      // Fallback if tenant election table not yet provisioned
    }

    // 3. Fetch Campaign Settings from Tenant DB
    let campaignSettings = null;
    try {
      const campRes = await tenantPool.query(
        `SELECT candidate_name AS "candidateName", party_name AS "partyName" FROM campaign_settings LIMIT 1;`
      );
      campaignSettings = campRes.rows[0] || null;
    } catch {
      // Ignore if table or columns differ
    }

    return {
      templates: templateRows,
      election: {
        id: defaultElection?.id || null,
        name: defaultElection?.name || null,
        electionDate: defaultElection?.electionDate || null,
      },
      campaign: {
        candidateName: campaignSettings?.candidateName || null,
        partyName: campaignSettings?.partyName || null,
      },
    };
  }
}
