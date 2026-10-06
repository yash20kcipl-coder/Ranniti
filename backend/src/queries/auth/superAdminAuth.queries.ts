import { query } from '../dbPool';

export interface SuperAdminUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'super_admin';
  roleName?: string | null;
  mobile?: string;
  avatar?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SuperAdminAuthQueries {
  static async findSuperAdminByEmail(identifier: string): Promise<SuperAdminUserRecord | null> {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const res = await query(
      `SELECT id, name, email, password_hash AS "passwordHash", 
              role, role_name AS "roleName", mobile, avatar, status,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users 
       WHERE role = 'super_admin' AND (LOWER(email) = $1 OR mobile = $1)`,
      [cleanIdentifier]
    );
    return res.rows[0] || null;
  }

  static async findSuperAdminById(id: string): Promise<SuperAdminUserRecord | null> {
    const res = await query(
      `SELECT id, name, email, password_hash AS "passwordHash", 
              role, role_name AS "roleName", mobile, avatar, status,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users 
       WHERE role = 'super_admin' AND id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createSuperAdmin(data: {
    name: string;
    email: string;
    passwordHash: string;
    roleName?: string | null;
    mobile?: string;
    avatar?: string | null;
  }): Promise<SuperAdminUserRecord> {
    const res = await query(
      `INSERT INTO admin_users (name, email, password_hash, role, role_name, mobile, avatar)
       VALUES ($1, $2, $3, 'super_admin', $4, $5, $6)
       RETURNING id, name, email, password_hash AS "passwordHash", 
                 role, role_name AS "roleName", mobile, avatar, status,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.name,
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.roleName || 'Platform Super Admin',
        data.mobile || null,
        data.avatar || null,
      ]
    );
    return res.rows[0];
  }
}
