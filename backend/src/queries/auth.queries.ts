import { query } from './dbPool';

export interface UserRecord {
  id: string;
  organizationId?: string | null;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  mobile?: string;
  avatar?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthQueries {
  static async findUserByEmail(email: string): Promise<UserRecord | null> {
    const res = await query(
      `SELECT id, organization_id AS "organizationId", name, email, password_hash AS "passwordHash", 
              role, mobile, avatar, status, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  }

  static async findUserById(id: string): Promise<UserRecord | null> {
    const res = await query(
      `SELECT id, organization_id AS "organizationId", name, email, password_hash AS "passwordHash", 
              role, mobile, avatar, status, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
    organizationId?: string;
    mobile?: string;
  }): Promise<UserRecord> {
    const res = await query(
      `INSERT INTO admin_users (name, email, password_hash, role, organization_id, mobile)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, organization_id AS "organizationId", name, email, password_hash AS "passwordHash", 
                 role, mobile, avatar, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.name,
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.role || 'user',
        data.organizationId || null,
        data.mobile || null,
      ]
    );
    return res.rows[0];
  }

  static async updatePassword(id: string, newPasswordHash: string): Promise<void> {
    await query(
      `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newPasswordHash, id]
    );
  }

}

