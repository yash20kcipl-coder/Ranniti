import { query } from './dbPool';

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
  assignedBoothIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class AuthQueries {
  static async getAssignedBoothIds(userId: string): Promise<string[]> {
    const res = await query(
      `SELECT booth_id FROM user_booth_assignments WHERE user_id = $1`,
      [userId]
    );
    return res.rows.map((row: { booth_id: string }) => row.booth_id);
  }

  static async assignBoothsToUser(userId: string, boothIds: string[]): Promise<void> {
    await query(`DELETE FROM user_booth_assignments WHERE user_id = $1`, [userId]);
    if (boothIds && boothIds.length > 0) {
      for (const boothId of boothIds) {
        await query(
          `INSERT INTO user_booth_assignments (user_id, booth_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, boothId]
        );
      }
    }
  }

  static async findUserByEmail(email: string): Promise<UserRecord | null> {
    const res = await query(
      `SELECT id, name, email, password_hash AS "passwordHash", 
              role, role_name AS "roleName", mobile, avatar, status, tenant_db_name AS "tenantDbName",
              parent_leader_id AS "parentLeaderId", assigned_ac_id AS "assignedAcId",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (!res.rows[0]) return null;
    const user = res.rows[0];
    user.assignedBoothIds = await this.getAssignedBoothIds(user.id);
    return user;
  }

  static async findUserById(id: string): Promise<UserRecord | null> {
    const res = await query(
      `SELECT id, name, email, password_hash AS "passwordHash", 
              role, role_name AS "roleName", mobile, avatar, status, tenant_db_name AS "tenantDbName",
              parent_leader_id AS "parentLeaderId", assigned_ac_id AS "assignedAcId",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users WHERE id = $1`,
      [id]
    );
    if (!res.rows[0]) return null;
    const user = res.rows[0];
    user.assignedBoothIds = await this.getAssignedBoothIds(user.id);
    return user;
  }

  static async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
    roleName?: string | null;
    mobile?: string;
    avatar?: string | null;
    tenantDbName?: string | null;
    parentLeaderId?: string | null;
    assignedAcId?: string | null;
    assignedBoothIds?: string[];
  }): Promise<UserRecord> {
    const res = await query(
      `INSERT INTO admin_users (name, email, password_hash, role, role_name, mobile, avatar, tenant_db_name, parent_leader_id, assigned_ac_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, password_hash AS "passwordHash", 
                 role, role_name AS "roleName", mobile, avatar, status, tenant_db_name AS "tenantDbName",
                 parent_leader_id AS "parentLeaderId", assigned_ac_id AS "assignedAcId",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.name,
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.role || 'user',
        data.roleName || null,
        data.mobile || null,
        data.avatar || null,
        data.tenantDbName || null,
        data.parentLeaderId || null,
        data.assignedAcId || null,
      ]
    );
    const user = res.rows[0];
    if (data.assignedBoothIds && data.assignedBoothIds.length > 0) {
      await this.assignBoothsToUser(user.id, data.assignedBoothIds);
      user.assignedBoothIds = data.assignedBoothIds;
    } else {
      user.assignedBoothIds = [];
    }
    return user;
  }

  static async updatePassword(id: string, newPasswordHash: string): Promise<void> {
    await query(
      `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newPasswordHash, id]
    );
  }

}

