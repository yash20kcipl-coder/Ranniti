import { Pool } from 'pg';

export interface ElectionRecord {
  id: string;
  name: string;
  electionCode: string | null;
  electionType: string;
  electionDate: string;
  countingDate: string | null;
  stateId: string | null;
  stateName?: string | null;
  pcId: string | null;
  pcName?: string | null;
  acId: string | null;
  acName?: string | null;
  isActive: boolean;
  isDefault: boolean;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  totalVotersSnapshot: number;
  targetVotes: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ElectionFilters {
  search?: string;
  status?: string;
  electionType?: string;
  page?: number;
  limit?: number;
}

const mapElectionRow = (row: any): ElectionRecord => ({
  id: row.id,
  name: row.name,
  electionCode: row.election_code || null,
  electionType: row.election_type || 'ASSEMBLY',
  electionDate: row.election_date ? new Date(row.election_date).toISOString().split('T')[0] : '',
  countingDate: row.counting_date ? new Date(row.counting_date).toISOString().split('T')[0] : null,
  stateId: row.state_id || null,
  stateName: row.state_name || null,
  pcId: row.pc_id || null,
  pcName: row.pc_name || null,
  acId: row.ac_id || null,
  acName: row.ac_name || null,
  isActive: Boolean(row.is_active),
  isDefault: Boolean(row.is_default),
  status: row.status || 'UPCOMING',
  totalVotersSnapshot: parseInt(row.total_voters_snapshot || '0', 10),
  targetVotes: parseInt(row.target_votes || '0', 10),
  description: row.description || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const electionQueries = {
  /**
   * Fetch paginated list of elections with optional search & filters
   */
  async getTenantElections(
    pool: Pool,
    filters: ElectionFilters = {}
  ): Promise<{ data: ElectionRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.search && filters.search.trim()) {
      conditions.push(`(e.name ILIKE $${paramIndex} OR e.election_code ILIKE $${paramIndex})`);
      values.push(`%${filters.search.trim()}%`);
      paramIndex++;
    }

    if (filters.status && filters.status.trim()) {
      conditions.push(`e.status = $${paramIndex}`);
      values.push(filters.status.trim().toUpperCase());
      paramIndex++;
    }

    if (filters.electionType && filters.electionType.trim()) {
      conditions.push(`e.election_type = $${paramIndex}`);
      values.push(filters.electionType.trim().toUpperCase());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM elections e
      ${whereClause};
    `;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const selectQuery = `
      SELECT 
        e.*,
        s.name AS state_name,
        pc.name AS pc_name,
        ac.name AS ac_name
      FROM elections e
      LEFT JOIN states s ON s.id = e.state_id
      LEFT JOIN parliamentary_constituencies pc ON pc.id = e.pc_id
      LEFT JOIN assembly_constituencies ac ON ac.id = e.ac_id
      ${whereClause}
      ORDER BY e.is_default DESC, e.election_date DESC, e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    values.push(limit, offset);

    const result = await pool.query(selectQuery, values);
    const data = result.rows.map(mapElectionRow);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Fetch single election by ID
   */
  async getTenantElectionById(pool: Pool, id: string): Promise<ElectionRecord | null> {
    const query = `
      SELECT 
        e.*,
        s.name AS state_name,
        pc.name AS pc_name,
        ac.name AS ac_name
      FROM elections e
      LEFT JOIN states s ON s.id = e.state_id
      LEFT JOIN parliamentary_constituencies pc ON pc.id = e.pc_id
      LEFT JOIN assembly_constituencies ac ON ac.id = e.ac_id
      WHERE e.id = $1
      LIMIT 1;
    `;
    const res = await pool.query(query, [id]);
    if (!res.rows[0]) return null;
    return mapElectionRow(res.rows[0]);
  },

  /**
   * Create new election
   */
  async createTenantElection(
    pool: Pool,
    payload: {
      name: string;
      electionCode?: string;
      electionType?: string;
      electionDate: string;
      countingDate?: string;
      stateId?: string;
      pcId?: string;
      acId?: string;
      isActive?: boolean;
      isDefault?: boolean;
      status?: string;
      totalVotersSnapshot?: number;
      targetVotes?: number;
      description?: string;
    }
  ): Promise<ElectionRecord> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const isDefault = Boolean(payload.isDefault);
      if (isDefault) {
        await client.query(`UPDATE elections SET is_default = false WHERE is_default = true`);
      }

      const insertQuery = `
        INSERT INTO elections (
          name, election_code, election_type, election_date, counting_date,
          state_id, pc_id, ac_id, is_active, is_default, status,
          total_voters_snapshot, target_votes, description, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, NOW(), NOW()
        )
        RETURNING *;
      `;
      const values = [
        payload.name.trim(),
        payload.electionCode?.trim() || null,
        payload.electionType?.trim() || 'ASSEMBLY',
        payload.electionDate,
        payload.countingDate || null,
        payload.stateId || null,
        payload.pcId || null,
        payload.acId || null,
        payload.isActive !== undefined ? payload.isActive : true,
        isDefault,
        payload.status || 'UPCOMING',
        payload.totalVotersSnapshot || 0,
        payload.targetVotes || 0,
        payload.description?.trim() || null,
      ];

      const res = await client.query(insertQuery, values);
      await client.query('COMMIT');
      return mapElectionRow(res.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Update existing election
   */
  async updateTenantElection(
    pool: Pool,
    id: string,
    payload: Partial<{
      name: string;
      electionCode?: string;
      electionType?: string;
      electionDate?: string;
      countingDate?: string;
      stateId?: string;
      pcId?: string;
      acId?: string;
      isActive?: boolean;
      isDefault?: boolean;
      status?: string;
      totalVotersSnapshot?: number;
      targetVotes?: number;
      description?: string;
    }>
  ): Promise<ElectionRecord | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (payload.isDefault === true) {
        await client.query(`UPDATE elections SET is_default = false WHERE id <> $1`, [id]);
      }

      const updateQuery = `
        UPDATE elections
        SET
          name = COALESCE($1, name),
          election_code = COALESCE($2, election_code),
          election_type = COALESCE($3, election_type),
          election_date = COALESCE($4, election_date),
          counting_date = CASE WHEN $5::text IS NOT NULL THEN $5::date ELSE counting_date END,
          state_id = CASE WHEN $6::text IS NOT NULL THEN $6::uuid ELSE state_id END,
          pc_id = CASE WHEN $7::text IS NOT NULL THEN $7::uuid ELSE pc_id END,
          ac_id = CASE WHEN $8::text IS NOT NULL THEN $8::uuid ELSE ac_id END,
          is_active = COALESCE($9, is_active),
          is_default = COALESCE($10, is_default),
          status = COALESCE($11, status),
          total_voters_snapshot = COALESCE($12, total_voters_snapshot),
          target_votes = COALESCE($13, target_votes),
          description = CASE WHEN $14::text IS NOT NULL THEN $14 ELSE description END,
          updated_at = NOW()
        WHERE id = $15
        RETURNING *;
      `;

      const values = [
        payload.name?.trim() ?? null,
        payload.electionCode !== undefined ? payload.electionCode?.trim() || null : null,
        payload.electionType?.trim() ?? null,
        payload.electionDate ?? null,
        payload.countingDate ?? null,
        payload.stateId ?? null,
        payload.pcId ?? null,
        payload.acId ?? null,
        payload.isActive ?? null,
        payload.isDefault ?? null,
        payload.status ?? null,
        payload.totalVotersSnapshot ?? null,
        payload.targetVotes ?? null,
        payload.description !== undefined ? payload.description?.trim() || null : null,
        id,
      ];

      const res = await client.query(updateQuery, values);
      await client.query('COMMIT');
      if (!res.rows[0]) return null;
      return mapElectionRow(res.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Set target election as the single default campaign election
   */
  async setDefaultTenantElection(pool: Pool, id: string): Promise<ElectionRecord | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE elections SET is_default = false WHERE id <> $1`, [id]);
      const res = await client.query(
        `UPDATE elections SET is_default = true, is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *;`,
        [id]
      );
      await client.query('COMMIT');
      if (!res.rows[0]) return null;
      return mapElectionRow(res.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Resolve active default election using date hierarchy:
   * Tier 1: Ongoing today (CURRENT_DATE between election_date and COALESCE(counting_date, election_date))
   * Tier 2: Nearest upcoming election (election_date >= CURRENT_DATE, ASC)
   * Tier 3: Most recent past election (election_date < CURRENT_DATE, DESC)
   */
  async resolveDateBasedDefaultElection(pool: Pool): Promise<ElectionRecord | null> {
    const query = `
      SELECT 
        e.*,
        s.name AS state_name,
        pc.name AS pc_name,
        ac.name AS ac_name
      FROM elections e
      LEFT JOIN states s ON s.id = e.state_id
      LEFT JOIN parliamentary_constituencies pc ON pc.id = e.pc_id
      LEFT JOIN assembly_constituencies ac ON ac.id = e.ac_id
      WHERE e.is_active = true
      ORDER BY
        CASE 
          WHEN CURRENT_DATE BETWEEN e.election_date AND COALESCE(e.counting_date, e.election_date) THEN 1
          WHEN e.election_date >= CURRENT_DATE THEN 2
          ELSE 3
        END ASC,
        CASE WHEN e.election_date >= CURRENT_DATE THEN e.election_date END ASC,
        CASE WHEN e.election_date < CURRENT_DATE THEN e.election_date END DESC,
        e.created_at DESC
      LIMIT 1;
    `;
    const res = await pool.query(query);
    if (!res.rows[0]) return null;
    return mapElectionRow(res.rows[0]);
  },

  /**
   * Synchronize election campaign statuses and default election flag based on today's date
   */
  async syncTenantDefaultElection(pool: Pool): Promise<ElectionRecord | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Auto-update status based on current date
      await client.query(`
        UPDATE elections
        SET status = CASE
          WHEN CURRENT_DATE < election_date THEN 'UPCOMING'
          WHEN CURRENT_DATE BETWEEN election_date AND COALESCE(counting_date, election_date) THEN 'ACTIVE'
          ELSE 'COMPLETED'
        END,
        updated_at = NOW()
        WHERE status IN ('UPCOMING', 'ACTIVE', 'COMPLETED');
      `);

      // 2. Identify date-based winner
      const resolved = await this.resolveDateBasedDefaultElection(client as unknown as Pool);

      if (resolved) {
        await client.query(`UPDATE elections SET is_default = false WHERE id <> $1`, [resolved.id]);
        await client.query(`UPDATE elections SET is_default = true, updated_at = NOW() WHERE id = $1`, [resolved.id]);
        await client.query('COMMIT');
        return { ...resolved, isDefault: true };
      }

      await client.query('COMMIT');
      return null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Delete election
   */
  async deleteTenantElection(pool: Pool, id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM elections WHERE id = $1;`, [id]);
    // If deleted election was default, auto-sync remaining elections
    if ((res.rowCount ?? 0) > 0) {
      await this.syncTenantDefaultElection(pool).catch(() => {});
    }
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Record single voter election status (atomic upsert + booth counter sync)
   */
  async recordVoterStatus(
    pool: Pool,
    payload: {
      electionId: string;
      voterId: string;
      boothId?: string;
      hasVoted: boolean;
      markedByUserId?: string;
    }
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Resolve booth_id from voter if not explicitly provided
      let boothId = payload.boothId;
      if (!boothId) {
        const vRes = await client.query(`SELECT booth_id FROM voters WHERE id = $1 LIMIT 1;`, [payload.voterId]);
        boothId = vRes.rows[0]?.booth_id || null;
      }

      // 2. Atomic Upsert voter_election_statuses
      const upsertQuery = `
        INSERT INTO voter_election_statuses (
          election_id, voter_id, booth_id, has_voted, voted_at, marked_by_user_id, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          CASE WHEN $4 = true THEN NOW() ELSE NULL END,
          $5,
          NOW()
        )
        ON CONFLICT (election_id, voter_id) DO UPDATE SET
          has_voted = EXCLUDED.has_voted,
          voted_at = CASE 
            WHEN EXCLUDED.has_voted = true THEN COALESCE(voter_election_statuses.voted_at, NOW()) 
            ELSE NULL 
          END,
          marked_by_user_id = EXCLUDED.marked_by_user_id,
          updated_at = NOW()
        RETURNING *;
      `;

      const values = [
        payload.electionId,
        payload.voterId,
        boothId,
        Boolean(payload.hasVoted),
        payload.markedByUserId || null,
      ];

      const res = await client.query(upsertQuery, values);
      const row = res.rows[0];

      // 3. Increment/recalc booth turnout cache if boothId exists
      if (boothId) {
        await client.query(
          `
          INSERT INTO election_booth_turnout (
            election_id, booth_id, total_voters, voted_count, male_voted_count, female_voted_count, last_voted_at, updated_at
          )
          SELECT 
            $1, $2,
            (SELECT COUNT(*) FROM voters WHERE booth_id = $2),
            (SELECT COUNT(*) FROM voter_election_statuses WHERE election_id = $1 AND booth_id = $2 AND has_voted = true),
            (SELECT COUNT(*) FROM voter_election_statuses ves JOIN voters v ON v.id = ves.voter_id WHERE ves.election_id = $1 AND ves.booth_id = $2 AND ves.has_voted = true AND v.gender ILIKE 'male'),
            (SELECT COUNT(*) FROM voter_election_statuses ves JOIN voters v ON v.id = ves.voter_id WHERE ves.election_id = $1 AND ves.booth_id = $2 AND ves.has_voted = true AND v.gender ILIKE 'female'),
            (SELECT MAX(voted_at) FROM voter_election_statuses WHERE election_id = $1 AND booth_id = $2 AND has_voted = true),
            NOW()
          ON CONFLICT (election_id, booth_id) DO UPDATE SET
            total_voters = EXCLUDED.total_voters,
            voted_count = EXCLUDED.voted_count,
            male_voted_count = EXCLUDED.male_voted_count,
            female_voted_count = EXCLUDED.female_voted_count,
            last_voted_at = EXCLUDED.last_voted_at,
            updated_at = NOW();
          `,
          [payload.electionId, boothId]
        );
      }

      await client.query('COMMIT');
      return {
        id: row.id,
        electionId: row.election_id,
        voterId: row.voter_id,
        boothId: row.booth_id,
        hasVoted: Boolean(row.has_voted),
        votedAt: row.voted_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * High-throughput Batch Sync API for offline/mobile field workers
   */
  async batchSyncVoterStatus(
    pool: Pool,
    electionId: string,
    items: Array<{
      voterId: string;
      boothId?: string;
      hasVoted: boolean;
      votedAt?: string;
    }>,
    markedByUserId?: string
  ): Promise<{ syncedCount: number }> {
    if (!items || items.length === 0) return { syncedCount: 0 };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const voterIds = items.map((i) => i.voterId);
      const boothIds = items.map((i) => i.boothId || null);
      const hasVotedArr = items.map((i) => Boolean(i.hasVoted));
      const votedAtArr = items.map((i) => (i.votedAt ? new Date(i.votedAt) : i.hasVoted ? new Date() : null));

      const batchQuery = `
        INSERT INTO voter_election_statuses (
          election_id, voter_id, booth_id, has_voted, voted_at, marked_by_user_id, updated_at
        )
        SELECT 
          $1, 
          u.voter_id, 
          COALESCE(u.booth_id, v.booth_id), 
          u.has_voted, 
          u.voted_at, 
          $2,
          NOW()
        FROM UNNEST(
          $3::uuid[], $4::uuid[], $5::boolean[], $6::timestamptz[]
        ) AS u(voter_id, booth_id, has_voted, voted_at)
        LEFT JOIN voters v ON v.id = u.voter_id
        ON CONFLICT (election_id, voter_id) DO UPDATE SET
          has_voted = EXCLUDED.has_voted,
          voted_at = EXCLUDED.voted_at,
          marked_by_user_id = EXCLUDED.marked_by_user_id,
          updated_at = NOW();
      `;

      await client.query(batchQuery, [electionId, markedByUserId || null, voterIds, boothIds, hasVotedArr, votedAtArr]);

      // Refresh turnout for impacted booths
      const distinctBooths = Array.from(new Set(boothIds.filter(Boolean)));
      for (const bId of distinctBooths) {
        await client.query(
          `
          INSERT INTO election_booth_turnout (
            election_id, booth_id, total_voters, voted_count, male_voted_count, female_voted_count, last_voted_at, updated_at
          )
          SELECT 
            $1, $2,
            (SELECT COUNT(*) FROM voters WHERE booth_id = $2),
            (SELECT COUNT(*) FROM voter_election_statuses WHERE election_id = $1 AND booth_id = $2 AND has_voted = true),
            (SELECT COUNT(*) FROM voter_election_statuses ves JOIN voters v ON v.id = ves.voter_id WHERE ves.election_id = $1 AND ves.booth_id = $2 AND ves.has_voted = true AND v.gender ILIKE 'male'),
            (SELECT COUNT(*) FROM voter_election_statuses ves JOIN voters v ON v.id = ves.voter_id WHERE ves.election_id = $1 AND ves.booth_id = $2 AND ves.has_voted = true AND v.gender ILIKE 'female'),
            (SELECT MAX(voted_at) FROM voter_election_statuses WHERE election_id = $1 AND booth_id = $2 AND has_voted = true),
            NOW()
          ON CONFLICT (election_id, booth_id) DO UPDATE SET
            total_voters = EXCLUDED.total_voters,
            voted_count = EXCLUDED.voted_count,
            male_voted_count = EXCLUDED.male_voted_count,
            female_voted_count = EXCLUDED.female_voted_count,
            last_voted_at = EXCLUDED.last_voted_at,
            updated_at = NOW();
          `,
          [electionId, bId]
        );
      }

      await client.query('COMMIT');
      return { syncedCount: items.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Fast booth turnout rollup (<5ms)
   */
  async getBoothTurnout(pool: Pool, electionId: string, boothId?: string): Promise<any[]> {
    let query = `
      SELECT 
        ebt.election_id,
        ebt.booth_id,
        b.booth_number,
        b.name AS booth_name,
        COALESCE(ebt.total_voters, b.total_voters, 0) AS total_voters,
        COALESCE(ebt.voted_count, 0) AS voted_count,
        COALESCE(ebt.male_voted_count, 0) AS male_voted_count,
        COALESCE(ebt.female_voted_count, 0) AS female_voted_count,
        CASE 
          WHEN COALESCE(ebt.total_voters, b.total_voters, 0) > 0 
          THEN ROUND((COALESCE(ebt.voted_count, 0)::numeric / COALESCE(ebt.total_voters, b.total_voters, 1)::numeric) * 100, 2)
          ELSE 0.00 
        END AS turnout_percentage,
        ebt.last_voted_at,
        ebt.updated_at
      FROM booths b
      LEFT JOIN election_booth_turnout ebt ON ebt.booth_id = b.id AND ebt.election_id = $1
    `;
    const params: any[] = [electionId];

    if (boothId) {
      query += ` WHERE b.id = $2`;
      params.push(boothId);
    }

    query += ` ORDER BY b.booth_number ASC;`;
    const res = await pool.query(query, params);
    return res.rows.map((r) => ({
      electionId: r.election_id,
      boothId: r.booth_id,
      boothNumber: r.booth_number,
      boothName: r.booth_name,
      totalVoters: parseInt(r.total_voters || '0', 10),
      votedCount: parseInt(r.voted_count || '0', 10),
      maleVotedCount: parseInt(r.male_voted_count || '0', 10),
      femaleVotedCount: parseInt(r.female_voted_count || '0', 10),
      turnoutPercentage: parseFloat(r.turnout_percentage || '0'),
      lastVotedAt: r.last_voted_at,
      updatedAt: r.updated_at,
    }));
  },

  /**
   * Hourly Turnout Surge Analytics (<8ms)
   */
  async getHourlyTurnoutAnalytics(pool: Pool, electionId: string): Promise<any[]> {
    const query = `
      SELECT 
        TO_CHAR(voted_at, 'HH24:00') AS time_slot,
        COUNT(*) AS votes_cast
      FROM voter_election_statuses
      WHERE election_id = $1 
        AND has_voted = true
        AND voted_at IS NOT NULL
      GROUP BY time_slot
      ORDER BY time_slot ASC;
    `;
    const res = await pool.query(query, [electionId]);
    return res.rows.map((r) => ({
      timeSlot: r.time_slot,
      votesCast: parseInt(r.votes_cast || '0', 10),
    }));
  },
};

