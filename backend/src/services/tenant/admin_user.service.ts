import { query } from '../../queries/dbPool';
import { ApiError } from '../../utils/apiError';
import { AdminUser, UpdateAdminUserInput } from '../../models/admin_user.model';
import { TenantPoolManager } from '../../utils/tenantPoolManager';
import { AuthQueries } from '../../queries/auth.queries';

export class AdminUserService {
  async getAllAdminUsers(): Promise<AdminUser[]> {
    const res = await query(
      `SELECT id, name, email, role, role_name AS "roleName", mobile, avatar, status,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users ORDER BY created_at DESC`
    );
    return res.rows;
  }

  async getTenantVolunteers(
    tenantDbName: string,
    filters: {
      role?: string;
      search?: string;
      status?: string;
      acId?: string;
    } = {}
  ): Promise<any[]> {
    const conditions: string[] = [`1=1`];
    const params: any[] = [];
    let idx = 1;

    if (filters.role && filters.role.trim()) {
      conditions.push(`u.role = $${idx++}`);
      params.push(filters.role.trim());
    } else {
      conditions.push(`u.role IN ('pc_leader', 'ac_leader', 'sub_leader', 'supporter')`);
    }

    if (filters.status && filters.status.trim()) {
      conditions.push(`u.status = $${idx++}`);
      params.push(filters.status.trim());
    }

    if (filters.acId && filters.acId.trim()) {
      conditions.push(`u.assigned_ac_id = $${idx++}`);
      params.push(filters.acId.trim());
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.mobile ILIKE $${idx})`);
      params.push(term);
      idx++;
    }

    const sql = `
      SELECT u.id, u.name, u.email, u.role, u.role_name AS "roleName", u.mobile, u.avatar, u.status,
             u.tenant_db_name AS "tenantDbName", u.parent_leader_id AS "parentLeaderId",
             parent.name AS "parentLeaderName",
             u.assigned_ac_id AS "assignedAcId",
             COALESCE(ARRAY_AGG(uba.booth_id) FILTER (WHERE uba.booth_id IS NOT NULL), '{}') AS "assignedBoothIds",
             COUNT(uba.booth_id)::int AS "assignedBoothCount",
             u.created_at AS "createdAt", u.updated_at AS "updatedAt"
      FROM tenant_users u
      LEFT JOIN tenant_users parent ON parent.id = u.parent_leader_id
      LEFT JOIN user_booth_assignments uba ON u.id = uba.user_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY u.id, parent.name
      ORDER BY 
        CASE u.role
          WHEN 'pc_leader' THEN 1
          WHEN 'ac_leader' THEN 2
          WHEN 'sub_leader' THEN 3
          WHEN 'supporter' THEN 4
          ELSE 5
        END,
        u.created_at DESC
    `;

    const res = await TenantPoolManager.query(tenantDbName, sql, params);
    return res.rows;
  }

  async getVolunteerBoothCoverage(tenantDbName: string): Promise<any> {
    const cadreRes = await TenantPoolManager.query(
      tenantDbName,
      `SELECT 
         COUNT(*)::int AS "totalCadre",
         COUNT(*) FILTER (WHERE role = 'pc_leader')::int AS "pcLeadersCount",
         COUNT(*) FILTER (WHERE role = 'ac_leader')::int AS "acLeadersCount",
         COUNT(*) FILTER (WHERE role = 'sub_leader')::int AS "subLeadersCount",
         COUNT(*) FILTER (WHERE role = 'supporter')::int AS "supportersCount",
         COUNT(DISTINCT uba.booth_id)::int AS "coveredBooths"
       FROM tenant_users u
       LEFT JOIN user_booth_assignments uba ON uba.user_id = u.id
       WHERE u.role IN ('pc_leader', 'ac_leader', 'sub_leader', 'supporter')`
    );

    let totalBooths = 0;
    try {
      const boothRes = await TenantPoolManager.query(tenantDbName, `SELECT COUNT(*)::int AS total FROM booths`);
      totalBooths = boothRes.rows[0]?.total || 0;
    } catch {
      totalBooths = 0;
    }

    const row = cadreRes.rows[0] || {};
    const coveredBooths = row.coveredBooths || 0;
    const coveragePercentage = totalBooths > 0 ? Math.round((coveredBooths / totalBooths) * 100) : 0;

    return {
      totalCadre: row.totalCadre || 0,
      pcLeadersCount: row.pcLeadersCount || 0,
      acLeadersCount: row.acLeadersCount || 0,
      subLeadersCount: row.subLeadersCount || 0,
      supportersCount: row.supportersCount || 0,
      totalBooths,
      coveredBooths,
      coveragePercentage,
    };
  }

  async getTeamMembersByParentId(parentLeaderId: string, tenantDbName?: string | null): Promise<AdminUser[]> {
    if (tenantDbName && tenantDbName.trim()) {
      const res = await TenantPoolManager.query(
        tenantDbName.trim(),
        `SELECT u.id, u.name, u.email, u.role, u.role_name AS "roleName", u.mobile, u.avatar, u.status,
                u.parent_leader_id AS "parentLeaderId", u.assigned_ac_id AS "assignedAcId",
                u.created_at AS "createdAt", u.updated_at AS "updatedAt",
                COALESCE(ARRAY_AGG(uba.booth_id) FILTER (WHERE uba.booth_id IS NOT NULL), '{}') AS "assignedBoothIds"
         FROM tenant_users u
         LEFT JOIN user_booth_assignments uba ON u.id = uba.user_id
         WHERE u.parent_leader_id = $1
         GROUP BY u.id
         ORDER BY u.created_at DESC`,
        [parentLeaderId]
      );
      return res.rows;
    }
    const res = await query(
      `SELECT u.id, u.name, u.email, u.role, u.role_name AS "roleName", u.mobile, u.avatar, u.status,
              u.parent_leader_id AS "parentLeaderId", u.assigned_ac_id AS "assignedAcId",
              u.created_at AS "createdAt", u.updated_at AS "updatedAt",
              '{}'::uuid[] AS "assignedBoothIds"
       FROM admin_users u
       WHERE u.parent_leader_id = $1
       ORDER BY u.created_at DESC`,
      [parentLeaderId]
    );
    return res.rows;
  }

  async getAdminUserById(id: string, tenantDbName?: string | null): Promise<AdminUser> {
    if (tenantDbName && tenantDbName.trim()) {
      const res = await TenantPoolManager.query(
        tenantDbName.trim(),
        `SELECT u.id, u.name, u.email, u.role, u.role_name AS "roleName", u.mobile, u.avatar, u.status,
                u.tenant_db_name AS "tenantDbName", u.parent_leader_id AS "parentLeaderId",
                u.assigned_ac_id AS "assignedAcId",
                COALESCE(ARRAY_AGG(uba.booth_id) FILTER (WHERE uba.booth_id IS NOT NULL), '{}') AS "assignedBoothIds",
                u.created_at AS "createdAt", u.updated_at AS "updatedAt"
         FROM tenant_users u
         LEFT JOIN user_booth_assignments uba ON u.id = uba.user_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [id]
      );
      if (res.rows[0]) return res.rows[0];
    }

    // Fallback: If tenantDbName is not explicitly passed, check active tenant databases
    if (!tenantDbName) {
      try {
        const tenantsRes = await query(`SELECT tenant_db_name FROM tenants WHERE tenant_db_name IS NOT NULL`);
        for (const tRow of tenantsRes.rows) {
          try {
            const tDb = tRow.tenant_db_name;
            const tCheck = await TenantPoolManager.query(
              tDb,
              `SELECT u.id, u.name, u.email, u.role, u.role_name AS "roleName", u.mobile, u.avatar, u.status,
                      u.tenant_db_name AS "tenantDbName", u.parent_leader_id AS "parentLeaderId",
                      u.assigned_ac_id AS "assignedAcId",
                      COALESCE(ARRAY_AGG(uba.booth_id) FILTER (WHERE uba.booth_id IS NOT NULL), '{}') AS "assignedBoothIds",
                      u.created_at AS "createdAt", u.updated_at AS "updatedAt"
               FROM tenant_users u
               LEFT JOIN user_booth_assignments uba ON u.id = uba.user_id
               WHERE u.id = $1
               GROUP BY u.id`,
              [id]
            );
            if (tCheck.rows[0]) return tCheck.rows[0];
          } catch {}
        }
      } catch {}
    }

    const res = await query(
      `SELECT u.id, u.name, u.email, u.role, u.role_name AS "roleName", u.mobile, u.avatar, u.status,
              u.tenant_db_name AS "tenantDbName", u.parent_leader_id AS "parentLeaderId",
              u.assigned_ac_id AS "assignedAcId",
              '{}'::uuid[] AS "assignedBoothIds",
              u.created_at AS "createdAt", u.updated_at AS "updatedAt"
       FROM admin_users u
       WHERE u.id = $1`,
      [id]
    );
    if (!res.rows[0]) {
      throw ApiError.notFound(`User with id '${id}' not found`);
    }
    return res.rows[0];
  }

  async updateAdminUser(id: string, input: any, tenantDbName?: string | null): Promise<AdminUser> {
    const currentUser = await this.getAdminUserById(id, tenantDbName);
    const targetDbName = currentUser.tenantDbName || tenantDbName;

    const FIELD_ROLES = ['pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter'];
    if (targetDbName && FIELD_ROLES.includes(currentUser.role)) {
      const updated = await AuthQueries.updateTenantUserProfile(id, input, targetDbName);
      return updated as any;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(input.name);
    }
    if (input.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(input.email ? input.email.toLowerCase().trim() : null);
    }
    if (input.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(input.role);
    }
    if (input.roleName !== undefined) {
      fields.push(`role_name = $${idx++}`);
      values.push(input.roleName);
    }
    if (input.mobile !== undefined) {
      fields.push(`mobile = $${idx++}`);
      values.push(input.mobile);
    }
    if (input.avatar !== undefined) {
      fields.push(`avatar = $${idx++}`);
      values.push(input.avatar);
    }
    if (input.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(input.status);
    }
    if (input.parentLeaderId !== undefined) {
      let validParentLeaderId: string | null = null;
      if (input.parentLeaderId && input.parentLeaderId !== 'null') {
        try {
          const parentCheck = await query(
            `SELECT id FROM admin_users WHERE id = $1 LIMIT 1`,
            [input.parentLeaderId]
          );
          if (parentCheck.rows.length > 0) {
            validParentLeaderId = input.parentLeaderId;
          }
        } catch {
          validParentLeaderId = null;
        }
      }
      fields.push(`parent_leader_id = $${idx++}`);
      values.push(validParentLeaderId);
    }
    if (input.assignedAcId !== undefined) {
      fields.push(`assigned_ac_id = $${idx++}`);
      values.push(input.assignedAcId || null);
    }

    if (input.assignedBoothIds !== undefined && Array.isArray(input.assignedBoothIds)) {
      await AuthQueries.assignBoothsToUser(id, input.assignedBoothIds);
    }

    if (fields.length === 0) {
      return this.getAdminUserById(id, tenantDbName);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${idx} 
       RETURNING id, name, email, role, role_name AS "roleName", mobile, avatar, status,
                 tenant_db_name AS "tenantDbName", parent_leader_id AS "parentLeaderId",
                 assigned_ac_id AS "assignedAcId",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );

    const updated = res.rows[0];
    updated.assignedBoothIds = await AuthQueries.getAssignedBoothIds(id);
    return updated;
  }

  async toggleVolunteerStatus(id: string, requestedStatus?: string, tenantDbName?: string | null): Promise<AdminUser> {
    const currentUser = await this.getAdminUserById(id, tenantDbName);
    const newStatus = requestedStatus || (currentUser.status === 'active' ? 'disabled' : 'active');
    const targetDbName = currentUser.tenantDbName || tenantDbName;

    if (targetDbName) {
      const updated = await AuthQueries.updateTenantUserProfile(id, { status: newStatus }, targetDbName);
      return updated as any;
    }

    const res = await query(
      `UPDATE admin_users
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, role_name AS "roleName", mobile, avatar, status,
                 tenant_db_name AS "tenantDbName", parent_leader_id AS "parentLeaderId",
                 assigned_ac_id AS "assignedAcId",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [newStatus, id]
    );

    const updated = res.rows[0];
    updated.assignedBoothIds = await AuthQueries.getAssignedBoothIds(id);
    return updated;
  }

  async deleteAdminUser(id: string, tenantDbName?: string | null): Promise<void> {
    const currentUser = await this.getAdminUserById(id, tenantDbName);
    const targetDbName = currentUser.tenantDbName || tenantDbName;

    if (targetDbName) {
      await TenantPoolManager.query(targetDbName, `DELETE FROM user_booth_assignments WHERE user_id = $1`, [id]);
      await TenantPoolManager.query(targetDbName, `DELETE FROM tenant_users WHERE id = $1`, [id]);
      return;
    }

    try {
      await query(`DELETE FROM user_booth_assignments WHERE user_id = $1`, [id]);
    } catch {}
    await query(`DELETE FROM admin_users WHERE id = $1`, [id]);
  }
}

export const adminUserService = new AdminUserService();
export const userService = adminUserService;
