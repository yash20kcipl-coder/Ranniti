import { query, dbPool } from './dbPool';

export interface SuperAdminElectionRecord {
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
  assignedTenantsCount: number;
  assignedTenants?: Array<{
    id: string;
    name: string;
    organizationName: string;
    assignedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminElectionFilters {
  search?: string;
  status?: string;
  electionType?: string;
  stateId?: string;
  pcId?: string;
  acId?: string;
  page?: number;
  limit?: number;
}

const mapSuperAdminElectionRow = (row: any): SuperAdminElectionRecord => ({
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
  assignedTenantsCount: parseInt(row.assigned_tenants_count || '0', 10),
  assignedTenants: row.assigned_tenants && Array.isArray(row.assigned_tenants) ? row.assigned_tenants : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const superAdminElectionQueries = {
  /**
   * Fetch paginated list of master elections with tenant assignment metrics
   */
  async getSuperAdminElections(
    filters: SuperAdminElectionFilters = {}
  ): Promise<{ data: SuperAdminElectionRecord[]; total: number; page: number; limit: number; totalPages: number }> {
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

    if (filters.stateId && filters.stateId.trim()) {
      conditions.push(`e.state_id = $${paramIndex}`);
      values.push(filters.stateId.trim());
      paramIndex++;
    }

    if (filters.pcId && filters.pcId.trim()) {
      conditions.push(`e.pc_id = $${paramIndex}`);
      values.push(filters.pcId.trim());
      paramIndex++;
    }

    if (filters.acId && filters.acId.trim()) {
      conditions.push(`e.ac_id = $${paramIndex}`);
      values.push(filters.acId.trim());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM elections e
      ${whereClause};
    `;
    const countRes = await query(countQuery, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const selectQuery = `
      SELECT 
        e.*,
        s.name AS state_name,
        pc.name AS pc_name,
        ac.name AS ac_name,
        COUNT(DISTINCT te.tenant_id) AS assigned_tenants_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', t.id,
              'name', t.name,
              'organizationName', t.organization_name,
              'assignedAt', te.assigned_at
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) AS assigned_tenants
      FROM elections e
      LEFT JOIN states s ON s.id = e.state_id
      LEFT JOIN parliamentary_constituencies pc ON pc.id = e.pc_id
      LEFT JOIN assembly_constituencies ac ON ac.id = e.ac_id
      LEFT JOIN tenant_elections te ON te.election_id = e.id
      LEFT JOIN tenants t ON t.id = te.tenant_id
      ${whereClause}
      GROUP BY e.id, s.name, pc.name, ac.name
      ORDER BY e.election_date DESC, e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    values.push(limit, offset);

    const result = await query(selectQuery, values);
    const data = result.rows.map(mapSuperAdminElectionRow);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Fetch single election by ID with detailed assigned tenants
   */
  async getSuperAdminElectionById(id: string): Promise<SuperAdminElectionRecord | null> {
    const sql = `
      SELECT 
        e.*,
        s.name AS state_name,
        pc.name AS pc_name,
        ac.name AS ac_name,
        COUNT(DISTINCT te.tenant_id) AS assigned_tenants_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', t.id,
              'name', t.name,
              'organizationName', t.organization_name,
              'assignedAt', te.assigned_at
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) AS assigned_tenants
      FROM elections e
      LEFT JOIN states s ON s.id = e.state_id
      LEFT JOIN parliamentary_constituencies pc ON pc.id = e.pc_id
      LEFT JOIN assembly_constituencies ac ON ac.id = e.ac_id
      LEFT JOIN tenant_elections te ON te.election_id = e.id
      LEFT JOIN tenants t ON t.id = te.tenant_id
      WHERE e.id = $1
      GROUP BY e.id, s.name, pc.name, ac.name
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    if (!res.rows[0]) return null;
    return mapSuperAdminElectionRow(res.rows[0]);
  },

  /**
   * Create new Master Election with optional tenant assignments
   */
  async createSuperAdminElection(
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
      status?: string;
      totalVotersSnapshot?: number;
      targetVotes?: number;
      description?: string;
      tenantIds?: string[];
    },
    assignedByUserId?: string
  ): Promise<SuperAdminElectionRecord> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

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
        false,
        payload.status || 'UPCOMING',
        payload.totalVotersSnapshot || 0,
        payload.targetVotes || 0,
        payload.description?.trim() || null,
      ];

      const res = await client.query(insertQuery, values);
      const electionId = res.rows[0].id;

      if (payload.tenantIds && payload.tenantIds.length > 0) {
        for (const tenantId of payload.tenantIds) {
          await client.query(
            `INSERT INTO tenant_elections (tenant_id, election_id, assigned_by)
             VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id, election_id) DO NOTHING;`,
            [tenantId, electionId, assignedByUserId || null]
          );
        }
      }

      await client.query('COMMIT');
      const created = await this.getSuperAdminElectionById(electionId);
      if (!created) {
        return mapSuperAdminElectionRow(res.rows[0]);
      }
      return created;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Update existing Master Election
   */
  async updateSuperAdminElection(
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
      status?: string;
      totalVotersSnapshot?: number;
      targetVotes?: number;
      description?: string;
      tenantIds?: string[];
    }>,
    assignedByUserId?: string
  ): Promise<SuperAdminElectionRecord | null> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const updateQuery = `
        UPDATE elections
        SET
          name = COALESCE($1, name),
          election_code = CASE WHEN $2::text IS NOT NULL THEN $2::text ELSE election_code END,
          election_type = COALESCE($3, election_type),
          election_date = COALESCE($4, election_date),
          counting_date = CASE WHEN $5::text IS NOT NULL THEN $5::date ELSE counting_date END,
          state_id = CASE WHEN $6::text IS NOT NULL THEN $6::uuid ELSE state_id END,
          pc_id = CASE WHEN $7::text IS NOT NULL THEN $7::uuid ELSE pc_id END,
          ac_id = CASE WHEN $8::text IS NOT NULL THEN $8::uuid ELSE ac_id END,
          is_active = COALESCE($9, is_active),
          status = COALESCE($10, status),
          total_voters_snapshot = COALESCE($11, total_voters_snapshot),
          target_votes = COALESCE($12, target_votes),
          description = CASE WHEN $13::text IS NOT NULL THEN $13 ELSE description END,
          updated_at = NOW()
        WHERE id = $14
        RETURNING *;
      `;

      const values = [
        payload.name?.trim() ?? null,
        payload.electionCode !== undefined ? payload.electionCode?.trim() || null : null,
        payload.electionType?.trim() ?? null,
        payload.electionDate ?? null,
        payload.countingDate ?? null,
        payload.stateId !== undefined ? payload.stateId || null : null,
        payload.pcId !== undefined ? payload.pcId || null : null,
        payload.acId !== undefined ? payload.acId || null : null,
        payload.isActive !== undefined ? payload.isActive : null,
        payload.status ?? null,
        payload.totalVotersSnapshot !== undefined ? payload.totalVotersSnapshot : null,
        payload.targetVotes !== undefined ? payload.targetVotes : null,
        payload.description !== undefined ? payload.description?.trim() || null : null,
        id,
      ];

      const res = await client.query(updateQuery, values);
      if (!res.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }

      // If tenantIds array was provided, sync tenant assignments
      if (payload.tenantIds !== undefined) {
        // Remove unselected tenants
        if (payload.tenantIds.length === 0) {
          await client.query(`DELETE FROM tenant_elections WHERE election_id = $1`, [id]);
        } else {
          await client.query(
            `DELETE FROM tenant_elections WHERE election_id = $1 AND NOT (tenant_id = ANY($2::uuid[]))`,
            [id, payload.tenantIds]
          );
          // Insert newly assigned tenants
          for (const tenantId of payload.tenantIds) {
            await client.query(
              `INSERT INTO tenant_elections (tenant_id, election_id, assigned_by)
               VALUES ($1, $2, $3)
               ON CONFLICT (tenant_id, election_id) DO NOTHING;`,
              [tenantId, id, assignedByUserId || null]
            );
          }
        }
      }

      await client.query('COMMIT');
      return await this.getSuperAdminElectionById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Delete Master Election
   */
  async deleteSuperAdminElection(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM elections WHERE id = $1 RETURNING id;`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Assign an election to one or more tenants
   */
  async assignElectionToTenants(
    electionId: string,
    tenantIds: string[],
    assignedByUserId?: string
  ): Promise<number> {
    let assignedCount = 0;
    for (const tenantId of tenantIds) {
      const res = await query(
        `INSERT INTO tenant_elections (tenant_id, election_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, election_id) DO NOTHING
         RETURNING id;`,
        [tenantId, electionId, assignedByUserId || null]
      );
      if ((res.rowCount ?? 0) > 0) assignedCount++;
    }
    return assignedCount;
  },

  /**
   * Assign one or more elections to a specific tenant
   */
  async assignElectionsToTenant(
    tenantId: string,
    electionIds: string[],
    assignedByUserId?: string
  ): Promise<number> {
    let assignedCount = 0;
    for (const electionId of electionIds) {
      const res = await query(
        `INSERT INTO tenant_elections (tenant_id, election_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, election_id) DO NOTHING
         RETURNING id;`,
        [tenantId, electionId, assignedByUserId || null]
      );
      if ((res.rowCount ?? 0) > 0) assignedCount++;
    }
    return assignedCount;
  },

  /**
   * Unassign an election from a specific tenant
   */
  async unassignElectionFromTenant(electionId: string, tenantId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM tenant_elections WHERE election_id = $1 AND tenant_id = $2 RETURNING id;`,
      [electionId, tenantId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Get all tenants assigned to a specific election
   */
  async getAssignedTenantsForElection(electionId: string): Promise<Array<{ id: string; name: string; tenantDbName: string }>> {
    const res = await query(
      `SELECT t.id, t.name, t.tenant_db_name
       FROM tenants t
       JOIN tenant_elections te ON te.tenant_id = t.id
       WHERE te.election_id = $1;`,
      [electionId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      tenantDbName: row.tenant_db_name,
    }));
  },

  /**
   * Get all elections assigned to a specific tenant
   */
  async getAssignedElectionsForTenant(tenantId: string): Promise<SuperAdminElectionRecord[]> {
    const res = await query(
      `SELECT 
        e.*,
        s.name AS state_name,
        pc.name AS pc_name,
        ac.name AS ac_name,
        1 AS assigned_tenants_count,
        '[]'::json AS assigned_tenants
       FROM elections e
       JOIN tenant_elections te ON te.election_id = e.id
       LEFT JOIN states s ON s.id = e.state_id
       LEFT JOIN parliamentary_constituencies pc ON pc.id = e.pc_id
       LEFT JOIN assembly_constituencies ac ON ac.id = e.ac_id
       WHERE te.tenant_id = $1
       ORDER BY e.election_date DESC;`,
      [tenantId]
    );
    return res.rows.map(mapSuperAdminElectionRow);
  },

  /**
   * Lightweight election options for dropdowns
   */
  async getElectionOptions(): Promise<Array<{
    id: string;
    name: string;
    electionCode: string | null;
    electionType: string;
    electionDate: string;
    status: string;
  }>> {
    const res = await query(
      `SELECT id, name, election_code, election_type, election_date, status
       FROM elections
       ORDER BY election_date DESC;`
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      electionCode: r.election_code || null,
      electionType: r.election_type,
      electionDate: r.election_date ? new Date(r.election_date).toISOString().split('T')[0] : '',
      status: r.status,
    }));
  },
};
