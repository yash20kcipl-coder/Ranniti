import { query } from './dbPool';
import { VolunteerAuthQueries, VolunteerUserRecord } from './auth/volunteerAuth.queries';
import { SuperAdminAuthQueries, SuperAdminUserRecord } from './auth/superAdminAuth.queries';
import { TenantAdminAuthQueries, TenantAdminUserRecord } from './auth/tenantAdminAuth.queries';

export { SuperAdminAuthQueries, SuperAdminUserRecord } from './auth/superAdminAuth.queries';
export { TenantAdminAuthQueries, TenantAdminUserRecord } from './auth/tenantAdminAuth.queries';
export { VolunteerAuthQueries, VolunteerUserRecord } from './auth/volunteerAuth.queries';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  roleName?: string | null;
  mobile?: string;
  avatar?: string;
  status: string;
  tenantDbName?: string | null;
  parentLeaderId?: string | null;
  assignedAcId?: string | null;
  assignedAcName?: string | null;
  assignedAc?: string | null;
  assignedPcId?: string | null;
  assignedPcName?: string | null;
  assignedPc?: string | null;
  assignedBoothIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class AuthQueries {
  static async getAssignedBoothIds(userId: string): Promise<string[]> {
    try {
      const res = await query(
        `SELECT booth_id FROM user_booth_assignments WHERE user_id = $1`,
        [userId]
      );
      return res.rows.map((row: { booth_id: string }) => row.booth_id);
    } catch {
      return [];
    }
  }

  static async getTenantUserAssignedBoothIds(userId: string, tenantDbName: string): Promise<string[]> {
    return VolunteerAuthQueries.getVolunteerAssignedBoothIds(userId, tenantDbName);
  }

  static async enrichUserLocationDetails(user: UserRecord): Promise<UserRecord> {
    try {
      const ROLE_NAME_MAP: Record<string, string> = {
        pc_leader: 'PC Leader',
        ac_leader: 'AC Leader',
        sub_leader: 'Sub-Leader / Ward Coordinator',
        supporter: 'Campaign Supporter / Volunteer',
        leader: 'Assembly / Sub-Sector Leader',
      };
      if (user.role && ROLE_NAME_MAP[user.role] && (!user.roleName || (user.role !== 'supporter' && user.roleName === 'Campaign Supporter / Volunteer'))) {
        user.roleName = ROLE_NAME_MAP[user.role];
      }

      if (user.assignedAcId) {
        const acRes = await query(
          `SELECT a.id AS ac_id, a.name AS ac_name, a.pc_id, p.name AS pc_name
           FROM assembly_constituencies a
           LEFT JOIN parliamentary_constituencies p ON p.id = a.pc_id
           WHERE a.id = $1`,
          [user.assignedAcId]
        );
        if (acRes.rows[0]) {
          user.assignedAcName = acRes.rows[0].ac_name;
          user.assignedAc = acRes.rows[0].ac_name;
          user.assignedPcId = user.assignedPcId || acRes.rows[0].pc_id;
          user.assignedPcName = user.assignedPcName || acRes.rows[0].pc_name;
          user.assignedPc = user.assignedPc || acRes.rows[0].pc_name;
        }
      }

      if ((!user.assignedPcName || !user.assignedAcName) && user.tenantDbName) {
        const tenantRes = await query(
          `SELECT pc_ids, ac_ids FROM tenants WHERE tenant_db_name = $1 LIMIT 1`,
          [user.tenantDbName]
        );
        if (tenantRes.rows[0]) {
          const { pc_ids, ac_ids } = tenantRes.rows[0];
          if (pc_ids && pc_ids.length > 0 && !user.assignedPcName) {
            user.assignedPcId = pc_ids[0];
            const pcRes = await query(
              `SELECT name FROM parliamentary_constituencies WHERE id = $1`,
              [pc_ids[0]]
            );
            if (pcRes.rows[0]) {
              user.assignedPcName = pcRes.rows[0].name;
              user.assignedPc = pcRes.rows[0].name;
            }
          }
          if (ac_ids && ac_ids.length > 0 && !user.assignedAcName) {
            const acRes = await query(
              `SELECT name FROM assembly_constituencies WHERE id = $1`,
              [ac_ids[0]]
            );
            if (acRes.rows[0]) {
              user.assignedAcName = acRes.rows[0].name;
              user.assignedAc = acRes.rows[0].name;
            }
          }
        }
      }

      if ((!user.assignedAcName || !user.assignedPcName) && user.assignedBoothIds && user.assignedBoothIds.length > 0) {
        const boothRes = await query(
          `SELECT b.ac_id, a.name AS ac_name, a.pc_id, p.name AS pc_name
           FROM booths b
           JOIN assembly_constituencies a ON a.id = b.ac_id
           LEFT JOIN parliamentary_constituencies p ON p.id = a.pc_id
           WHERE b.id = $1 LIMIT 1`,
          [user.assignedBoothIds[0]]
        );
        if (boothRes.rows[0]) {
          if (!user.assignedAcId) user.assignedAcId = boothRes.rows[0].ac_id;
          if (!user.assignedAcName) {
            user.assignedAcName = boothRes.rows[0].ac_name;
            user.assignedAc = boothRes.rows[0].ac_name;
          }
          if (!user.assignedPcId) user.assignedPcId = boothRes.rows[0].pc_id;
          if (!user.assignedPcName) {
            user.assignedPcName = boothRes.rows[0].pc_name;
            user.assignedPc = boothRes.rows[0].pc_name;
          }
        }
      }
    } catch {
      // Non-blocking enrichment
    }
    return user;
  }

  static async assignBoothsToUser(userId: string, boothIds: string[], tenantDbName?: string): Promise<void> {
    if (tenantDbName) {
      return VolunteerAuthQueries.assignBoothsToVolunteer(userId, boothIds, tenantDbName);
    }
  }

  static async assignBoothsToTenantUser(userId: string, boothIds: string[], tenantDbName: string): Promise<void> {
    return VolunteerAuthQueries.assignBoothsToVolunteer(userId, boothIds, tenantDbName);
  }

  static async updateTenantUserProfile(
    id: string,
    data: { name?: string; mobile?: string; avatar?: string; status?: string; role?: string; roleName?: string; assignedAcId?: string; parentLeaderId?: string; assignedBoothIds?: string[] },
    tenantDbName: string
  ): Promise<UserRecord> {
    const volunteer = await VolunteerAuthQueries.updateVolunteerProfile(id, data, tenantDbName);
    const user: UserRecord = { ...volunteer };
    return await this.enrichUserLocationDetails(user);
  }

  /**
   * Unified Web Portal User Lookup: checks superAdminAuth first, then tenantAdminAuth
   */
  static async findUserByEmail(identifier: string): Promise<UserRecord | null> {
    const superAdmin = await SuperAdminAuthQueries.findSuperAdminByEmail(identifier);
    if (superAdmin) {
      const user: UserRecord = {
        ...superAdmin,
        assignedBoothIds: [],
      };
      return await this.enrichUserLocationDetails(user);
    }

    const tenantAdmin = await TenantAdminAuthQueries.findTenantAdminByEmail(identifier);
    if (tenantAdmin) {
      const user: UserRecord = {
        ...tenantAdmin,
        assignedBoothIds: [],
      };
      return await this.enrichUserLocationDetails(user);
    }

    return null;
  }

  static async findUserById(id: string): Promise<UserRecord | null> {
    const superAdmin = await SuperAdminAuthQueries.findSuperAdminById(id);
    if (superAdmin) {
      const user: UserRecord = {
        ...superAdmin,
        assignedBoothIds: [],
      };
      return await this.enrichUserLocationDetails(user);
    }

    const tenantAdmin = await TenantAdminAuthQueries.findTenantAdminById(id);
    if (tenantAdmin) {
      const user: UserRecord = {
        ...tenantAdmin,
        assignedBoothIds: [],
      };
      return await this.enrichUserLocationDetails(user);
    }

    return null;
  }

  static async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
    roleName?: string | null;
    mobile?: string;
    avatar?: string | null;
  }): Promise<UserRecord> {
    if (data.role === 'super_admin') {
      const created = await SuperAdminAuthQueries.createSuperAdmin(data);
      const user: UserRecord = { ...created, assignedBoothIds: [] };
      return await this.enrichUserLocationDetails(user);
    }
    throw new Error('Use TenantQueries.createTenant for tenant registration — tenants have their own table.');
  }

  /**
   * Unified Mobile App User Lookup: delegates to VolunteerAuthQueries
   */
  static async findTenantUserByEmail(identifier: string, tenantDbName?: string | null): Promise<UserRecord | null> {
    const volunteer = await VolunteerAuthQueries.findVolunteerByIdentifier(identifier, tenantDbName);
    if (volunteer) {
      const user: UserRecord = { ...volunteer };
      return await this.enrichUserLocationDetails(user);
    }
    return null;
  }

  static async findTenantUserById(id: string, tenantDbName?: string | null): Promise<UserRecord | null> {
    const volunteer = await VolunteerAuthQueries.findVolunteerById(id, tenantDbName);
    if (volunteer) {
      const user: UserRecord = { ...volunteer };
      return await this.enrichUserLocationDetails(user);
    }
    return null;
  }

  static async createTenantUser(
    data: {
      name: string;
      email: string;
      passwordHash: string;
      role: string;
      roleName?: string | null;
      mobile?: string;
      avatar?: string | null;
      parentLeaderId?: string | null;
      assignedAcId?: string | null;
      assignedBoothIds?: string[];
    },
    tenantDbName: string
  ): Promise<UserRecord> {
    const volunteer = await VolunteerAuthQueries.createVolunteer(data, tenantDbName);
    const user: UserRecord = { ...volunteer };
    return await this.enrichUserLocationDetails(user);
  }

  static async updatePassword(id: string, newPasswordHash: string): Promise<void> {
    await query(
      `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newPasswordHash, id]
    );
    await query(
      `UPDATE tenants SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newPasswordHash, id]
    );
  }

  static async updateUserProfile(id: string, data: { name?: string; mobile?: string; avatar?: string }): Promise<UserRecord> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      params.push(data.name);
    }
    if (data.mobile !== undefined) {
      fields.push(`mobile = $${paramIdx++}`);
      params.push(data.mobile);
    }
    if (data.avatar !== undefined) {
      fields.push(`avatar = $${paramIdx++}`);
      params.push(data.avatar);
    }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      params.push(id);
      await query(
        `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${paramIdx}`,
        params
      );
      await query(
        `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramIdx}`,
        params
      );
    }
    const updated = await this.findUserById(id);
    return updated!;
  }
}
