import { query } from '../../queries/dbPool';
import { ApiError } from '../../utils/apiError';
import { hashPassword } from '../../utils/password';
import { mobileAccessService } from './mobileAccess.service';
import { AuthQueries, UserRecord } from '../../queries/auth.queries';

export interface OnboardTeamMemberPayload {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role: string;
  assignedAcId?: string;
  assignedBoothIds?: string[];
}

export class MobileTeamService {
  async onboardTeamMember(
    currentUser: Omit<UserRecord, 'passwordHash'>,
    payload: OnboardTeamMemberPayload
  ): Promise<Omit<UserRecord, 'passwordHash'>> {
    const roleAccess = await mobileAccessService.getRoleAccessConfig({
      role: currentUser.role,
      tenantDbName: currentUser.tenantDbName,
    });

    if (!roleAccess.canCreateRoles.includes(payload.role)) {
      throw ApiError.forbidden(
        `Your role (${roleAccess.roleName}) is not authorized to onboard members with role '${payload.role}'`
      );
    }

    const existingUser = await AuthQueries.findTenantUserByEmail(payload.email, currentUser.tenantDbName);
    if (existingUser) {
      throw ApiError.badRequest('An account with this email or mobile number already exists');
    }

    const passwordHash = await hashPassword(payload.password);
    const createdUser = await AuthQueries.createTenantUser(
      {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role,
        mobile: payload.mobile,
        parentLeaderId: currentUser.id,
        assignedAcId: payload.assignedAcId || currentUser.assignedAcId,
        assignedBoothIds: payload.assignedBoothIds || [],
      },
      currentUser.tenantDbName!
    );

    const { passwordHash: _, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }

  async getTeamMembers(
    currentUser: Omit<UserRecord, 'passwordHash'>,
    params: { role?: string; search?: string; page?: number; limit?: number }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['u.parent_leader_id = $1'];
    const values: any[] = [currentUser.id];
    let paramIndex = 2;

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

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*) FROM admin_users u ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

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
        u.assigned_ac_id AS "assignedAcId",
        u.created_at AS "createdAt",
        COALESCE(
          (SELECT COUNT(*) FROM user_booth_assignments uba WHERE uba.user_id = u.id),
          0
        )::int AS "assignedBoothsCount"
      FROM admin_users u
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
}

export const mobileTeamService = new MobileTeamService();
