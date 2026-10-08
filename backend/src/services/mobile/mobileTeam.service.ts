import { query } from '../../queries/dbPool';
import { ApiError } from '../../utils/apiError';
import { hashPassword } from '../../utils/password';
import { RoleQueries } from '../../queries/role.queries';
import { mobileAccessService } from './mobileAccess.service';
import { TenantPoolManager } from '../../utils/tenantPoolManager';
import { AuthQueries, UserRecord } from '../../queries/auth.queries';
import { generateVolunteerDefaultPassword } from '../../utils/volunteerPassword';

export interface OnboardTeamMemberPayload {
  name: string;
  email?: string;
  mobile?: string;
  password?: string;
  role: string;
  parentLeaderId?: string;
  assignedAcId?: string;
  assignedBoothIds?: string[];
  accessibleTabs?: any;
}

export class MobileTeamService {
  async onboardTeamMember(
    currentUser: Omit<UserRecord, 'passwordHash'>,
    payload: OnboardTeamMemberPayload
  ): Promise<Omit<UserRecord, 'passwordHash'> & { generatedDefaultPassword?: string }> {
    const roleAccess = await mobileAccessService.getRoleAccessConfig({
      role: currentUser.role,
      tenantDbName: currentUser.tenantDbName,
    });

    if (!roleAccess.canCreateRoles.includes(payload.role)) {
      throw ApiError.forbidden(
        `Your role (${roleAccess.roleName}) is not authorized to onboard members with role '${payload.role}'`
      );
    }

    const cleanPhone = (payload.mobile || '').replace(/\D/g, '');
    const cleanName = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const finalEmail = payload.email && payload.email.trim()
      ? payload.email.trim().toLowerCase()
      : `${cleanPhone || cleanName || 'user'}@ranniti.internal`;

    const finalPassword = payload.password && payload.password.trim().length >= 6
      ? payload.password.trim()
      : generateVolunteerDefaultPassword(payload.name, payload.mobile || '');

    const existingUser = await AuthQueries.findTenantUserByEmail(finalEmail, currentUser.tenantDbName);
    if (existingUser) {
      throw ApiError.badRequest('An account with this email already exists');
    }

    if (payload.mobile) {
      const existingMobile = await AuthQueries.findTenantUserByEmail(payload.mobile, currentUser.tenantDbName);
      if (existingMobile) {
        throw ApiError.badRequest('An account with this mobile number already exists');
      }
    }

    // Determine accessible tabs from role configuration in tenant DB if not provided
    let finalAccessibleTabs = payload.accessibleTabs;
    if (!finalAccessibleTabs && currentUser.tenantDbName) {
      try {
        const roles = await RoleQueries.getAllTenantUserRoles(currentUser.tenantDbName);
        const targetRole = roles.find((r) => r.roleKey === payload.role);
        if (targetRole?.accessibleTabs) {
          finalAccessibleTabs = targetRole.accessibleTabs;
        }
      } catch {
        // Fallback to default
      }
    }

    // Territorial scoping
    const effectiveParentId = payload.parentLeaderId || currentUser.id;
    let targetAcId = payload.assignedAcId;
    if (!targetAcId && effectiveParentId && currentUser.tenantDbName) {
      const parentUser = await AuthQueries.findTenantUserById(effectiveParentId, currentUser.tenantDbName);
      if (parentUser?.assignedAcId) {
        targetAcId = parentUser.assignedAcId;
      }
    }
    if (!targetAcId && (currentUser.role === 'ac_leader' || currentUser.role === 'sub_leader')) {
      targetAcId = currentUser.assignedAcId || payload.assignedAcId;
    }

    const passwordHash = await hashPassword(finalPassword);
    const createdUser = await AuthQueries.createTenantUser(
      {
        name: payload.name.trim(),
        email: finalEmail,
        passwordHash,
        role: payload.role,
        mobile: payload.mobile?.trim() || undefined,
        parentLeaderId: effectiveParentId,
        assignedAcId: targetAcId,
        assignedBoothIds: payload.assignedBoothIds || [],
        accessibleTabs: finalAccessibleTabs,
      },
      currentUser.tenantDbName!
    );

    const { passwordHash: _, ...userWithoutPassword } = createdUser;
    return {
      ...userWithoutPassword,
      generatedDefaultPassword: finalPassword,
    };

  }

  async getTeamMembers(
    currentUser: Omit<UserRecord, 'passwordHash'>,
    params: { role?: string; search?: string; page?: number; limit?: number }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [currentUser.id, currentUser.role];
    let paramIndex = 3;

    if (params.role && params.role.trim()) {
      conditions.push(`u.role = $${paramIndex}`);
      values.push(params.role.trim());
      paramIndex++;
    }

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.mobile ILIKE $${paramIndex})`);
      values.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (currentUser.tenantDbName) {
      const countSql = `
        WITH RECURSIVE team_hierarchy AS (
          SELECT id, role, parent_leader_id
          FROM tenant_users
          WHERE parent_leader_id = $1 OR ($2 = 'pc_leader' AND role = 'ac_leader' AND id != $1)
          UNION
          SELECT u.id, u.role, u.parent_leader_id
          FROM tenant_users u
          INNER JOIN team_hierarchy th ON u.parent_leader_id = th.id
        )
        SELECT COUNT(*) 
        FROM tenant_users u
        JOIN team_hierarchy th ON th.id = u.id
        ${whereClause}
      `;
      const countRes = await TenantPoolManager.query(currentUser.tenantDbName, countSql, values);
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      const listSql = `
        WITH RECURSIVE team_hierarchy AS (
          SELECT id, role, parent_leader_id
          FROM tenant_users
          WHERE parent_leader_id = $1 OR ($2 = 'pc_leader' AND role = 'ac_leader' AND id != $1)
          UNION
          SELECT u.id, u.role, u.parent_leader_id
          FROM tenant_users u
          INNER JOIN team_hierarchy th ON u.parent_leader_id = th.id
        )
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.mobile, 
          u.role, 
          COALESCE(u.role_name, tur.role_name, u.role) AS "roleName", 
          u.avatar, 
          u.status,
          u.parent_leader_id AS "parentLeaderId",
          pu.name AS "parentLeaderName",
          u.assigned_ac_id AS "assignedAcId",
          ac.name AS "assignedAcName",
          COALESCE(u.accessible_tabs, tur.accessible_tabs) AS "accessibleTabs",
          u.created_at AS "createdAt",
          COALESCE(
            (SELECT COUNT(*) FROM user_booth_assignments uba WHERE uba.user_id = u.id),
            0
          )::int AS "assignedBoothsCount",
          COALESCE(
            (
              SELECT json_agg(json_build_object('id', b.id, 'boothNumber', b.booth_number, 'name', b.name) ORDER BY b.booth_number ASC)
              FROM user_booth_assignments uba
              JOIN booths b ON b.id = uba.booth_id
              WHERE uba.user_id = u.id
            ),
            '[]'::json
          ) AS "assignedBooths"
        FROM tenant_users u
        JOIN team_hierarchy th ON th.id = u.id
        LEFT JOIN tenant_users pu ON pu.id = u.parent_leader_id
        LEFT JOIN tenant_user_roles tur ON tur.role_key = u.role
        LEFT JOIN assembly_constituencies ac ON ac.id = u.assigned_ac_id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const listRes = await TenantPoolManager.query(currentUser.tenantDbName, listSql, [...values, limit, offset]);

      return {
        teamMembers: listRes.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    // Fallback to master DB admin_users
    const countSql = `SELECT COUNT(*) FROM admin_users u ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const listSql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.mobile, 
        u.role, 
        u.role_name AS "roleName", 
        u.avatar, 
        u.status,
        u.parent_leader_id AS "parentLeaderId",
        pu.name AS "parentLeaderName",
        u.assigned_ac_id AS "assignedAcId",
        u.created_at AS "createdAt",
        COALESCE(
          (SELECT COUNT(*) FROM user_booth_assignments uba WHERE uba.user_id = u.id),
          0
        )::int AS "assignedBoothsCount"
      FROM admin_users u
      LEFT JOIN admin_users pu ON pu.id = u.parent_leader_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const listRes = await query(listSql, [...values, limit, offset]);

    return {
      teamMembers: listRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateTeamMember(
    currentUser: Omit<UserRecord, 'passwordHash'>,
    memberId: string,
    payload: {
      name?: string;
      email?: string;
      mobile?: string;
      password?: string;
      role?: string;
      status?: string;
      parentLeaderId?: string;
      assignedAcId?: string;
      assignedBoothIds?: string[];
      accessibleTabs?: any;
    }
  ) {
    if (currentUser.id === memberId) {
      throw ApiError.badRequest('You cannot edit your own account through team management');
    }

    const tenantDbName = currentUser.tenantDbName;
    if (!tenantDbName) {
      throw ApiError.badRequest('Tenant database context is required');
    }

    // Verify member exists and is within current user's downline hierarchy
    const checkSql = `
      WITH RECURSIVE team_hierarchy AS (
        SELECT id, role, parent_leader_id
        FROM tenant_users
        WHERE parent_leader_id = $1 OR ($2 = 'pc_leader' AND role = 'ac_leader' AND id != $1)
        UNION
        SELECT u.id, u.role, u.parent_leader_id
        FROM tenant_users u
        INNER JOIN team_hierarchy th ON u.parent_leader_id = th.id
      )
      SELECT u.id, u.name, u.email, u.mobile, u.role, u.status, th.id AS is_downline
      FROM tenant_users u
      LEFT JOIN team_hierarchy th ON th.id = u.id
      WHERE u.id = $3
      LIMIT 1
    `;
    const checkRes = await TenantPoolManager.query(tenantDbName, checkSql, [currentUser.id, currentUser.role, memberId]);
    if (checkRes.rows.length === 0) {
      throw ApiError.notFound('Team member not found');
    }

    const existingMember = checkRes.rows[0];
    if (!existingMember.is_downline) {
      throw ApiError.forbidden('You are not authorized to manage this team member');
    }

    // Check role changes permission
    if (payload.role && payload.role !== existingMember.role) {
      const roleAccess = await mobileAccessService.getRoleAccessConfig({
        role: currentUser.role,
        tenantDbName,
      });

      if (!roleAccess.canCreateRoles.includes(payload.role)) {
        throw ApiError.forbidden(
          `Your role (${roleAccess.roleName}) is not authorized to assign role '${payload.role}'`
        );
      }
    }

    // Check uniqueness for email
    if (payload.email && payload.email !== existingMember.email) {
      const emailRes = await TenantPoolManager.query(
        tenantDbName,
        'SELECT id FROM tenant_users WHERE email = $1 AND id != $2 LIMIT 1',
        [payload.email, memberId]
      );
      if (emailRes.rows.length > 0) {
        throw ApiError.badRequest('An account with this email already exists');
      }
    }

    // Check uniqueness for mobile
    if (payload.mobile && payload.mobile !== existingMember.mobile) {
      const mobileRes = await TenantPoolManager.query(
        tenantDbName,
        'SELECT id FROM tenant_users WHERE mobile = $1 AND id != $2 LIMIT 1',
        [payload.mobile, memberId]
      );
      if (mobileRes.rows.length > 0) {
        throw ApiError.badRequest('An account with this mobile number already exists');
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let pIdx = 1;

    if (payload.name !== undefined && payload.name.trim()) {
      updateFields.push(`name = $${pIdx++}`);
      updateValues.push(payload.name.trim());
    }

    if (payload.email !== undefined && payload.email.trim()) {
      updateFields.push(`email = $${pIdx++}`);
      updateValues.push(payload.email.trim());
    }

    if (payload.mobile !== undefined) {
      updateFields.push(`mobile = $${pIdx++}`);
      updateValues.push(payload.mobile.trim() || null);
    }

    if (payload.status !== undefined && ['active', 'inactive', 'suspended'].includes(payload.status)) {
      updateFields.push(`status = $${pIdx++}`);
      updateValues.push(payload.status);
    }

    if (payload.role !== undefined && payload.role.trim()) {
      const ROLE_NAME_MAP: Record<string, string> = {
        pc_leader: 'PC Leader',
        ac_leader: 'AC Leader',
        sub_leader: 'Sub-Leader / Ward Coordinator',
        supporter: 'Campaign Supporter / Volunteer',
        leader: 'Assembly / Sub-Sector Leader',
      };
      updateFields.push(`role = $${pIdx++}`);
      updateValues.push(payload.role.trim());

      updateFields.push(`role_name = $${pIdx++}`);
      updateValues.push(ROLE_NAME_MAP[payload.role.trim()] || payload.role.trim());
    }

    if (payload.parentLeaderId !== undefined) {
      updateFields.push(`parent_leader_id = $${pIdx++}`);
      updateValues.push(payload.parentLeaderId || null);
    }

    if (payload.assignedAcId !== undefined) {
      updateFields.push(`assigned_ac_id = $${pIdx++}`);
      updateValues.push(payload.assignedAcId || null);
    }

    if (payload.password && payload.password.trim().length >= 6) {
      const passwordHash = await hashPassword(payload.password.trim());
      updateFields.push(`password_hash = $${pIdx++}`);
      updateValues.push(passwordHash);
    }

    if (payload.accessibleTabs !== undefined) {
      updateFields.push(`accessible_tabs = $${pIdx++}::jsonb`);
      updateValues.push(JSON.stringify(payload.accessibleTabs));
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(memberId);
      const updateSql = `UPDATE tenant_users SET ${updateFields.join(', ')} WHERE id = $${pIdx}`;
      await TenantPoolManager.query(tenantDbName, updateSql, updateValues);
    }

    // Sync booth assignments if provided
    if (payload.assignedBoothIds !== undefined && Array.isArray(payload.assignedBoothIds)) {
      await TenantPoolManager.query(tenantDbName, 'DELETE FROM user_booth_assignments WHERE user_id = $1', [memberId]);
      for (const bId of payload.assignedBoothIds) {
        if (bId) {
          await TenantPoolManager.query(
            tenantDbName,
            'INSERT INTO user_booth_assignments (user_id, booth_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [memberId, bId]
          );
        }
      }
    }

    // Fetch and return the updated member
    const fetchSql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.mobile, 
        u.role, 
        COALESCE(u.role_name, tur.role_name, u.role) AS "roleName", 
        u.avatar, 
        u.status,
        u.parent_leader_id AS "parentLeaderId",
        pu.name AS "parentLeaderName",
        u.assigned_ac_id AS "assignedAcId",
        ac.name AS "assignedAcName",
        COALESCE(u.accessible_tabs, tur.accessible_tabs) AS "accessibleTabs",
        u.created_at AS "createdAt",
        COALESCE(
          (SELECT COUNT(*) FROM user_booth_assignments uba WHERE uba.user_id = u.id),
          0
        )::int AS "assignedBoothsCount",
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', b.id, 'boothNumber', b.booth_number, 'name', b.name) ORDER BY b.booth_number ASC)
            FROM user_booth_assignments uba
            JOIN booths b ON b.id = uba.booth_id
            WHERE uba.user_id = u.id
          ),
          '[]'::json
        ) AS "assignedBooths"
      FROM tenant_users u
      LEFT JOIN tenant_users pu ON pu.id = u.parent_leader_id
      LEFT JOIN tenant_user_roles tur ON tur.role_key = u.role
      LEFT JOIN assembly_constituencies ac ON ac.id = u.assigned_ac_id
      WHERE u.id = $1
      LIMIT 1
    `;
    const res = await TenantPoolManager.query(tenantDbName, fetchSql, [memberId]);
    return res.rows[0];
  }

  async deleteTeamMember(currentUser: Omit<UserRecord, 'passwordHash'>, memberId: string) {
    if (currentUser.id === memberId) {
      throw ApiError.badRequest('You cannot delete your own account');
    }

    const tenantDbName = currentUser.tenantDbName;
    if (!tenantDbName) {
      throw ApiError.badRequest('Tenant database context is required');
    }

    // Verify member exists and is downline of current user
    const checkSql = `
      WITH RECURSIVE team_hierarchy AS (
        SELECT id, role, parent_leader_id
        FROM tenant_users
        WHERE parent_leader_id = $1 OR ($2 = 'pc_leader' AND role = 'ac_leader' AND id != $1)
        UNION
        SELECT u.id, u.role, u.parent_leader_id
        FROM tenant_users u
        INNER JOIN team_hierarchy th ON u.parent_leader_id = th.id
      )
      SELECT u.id, th.id AS is_downline
      FROM tenant_users u
      LEFT JOIN team_hierarchy th ON th.id = u.id
      WHERE u.id = $3
      LIMIT 1
    `;
    const checkRes = await TenantPoolManager.query(tenantDbName, checkSql, [currentUser.id, currentUser.role, memberId]);
    if (checkRes.rows.length === 0) {
      throw ApiError.notFound('Team member not found');
    }

    if (!checkRes.rows[0].is_downline) {
      throw ApiError.forbidden('You are not authorized to delete this team member');
    }

    // Delete user (cascade automatically deletes booth assignments, children parent_leader_id set to null)
    await TenantPoolManager.query(tenantDbName, 'DELETE FROM tenant_users WHERE id = $1', [memberId]);

    return { id: memberId, message: 'Team member deleted successfully' };
  }
}

export const mobileTeamService = new MobileTeamService();

