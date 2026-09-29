import { query } from '../queries/dbPool';
import { ApiError } from '../utils/apiError';
import { AdminUser, UpdateAdminUserInput } from '../models/admin_user.model';

export class AdminUserService {
  async getAllAdminUsers(): Promise<AdminUser[]> {
    const res = await query(
      `SELECT id, organization_id AS "organizationId", name, email, role, mobile, avatar, status,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users ORDER BY created_at DESC`
    );
    return res.rows;
  }

  async getAdminUserById(id: string): Promise<AdminUser> {
    const res = await query(
      `SELECT id, organization_id AS "organizationId", name, email, role, mobile, avatar, status,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM admin_users WHERE id = $1`,
      [id]
    );
    if (!res.rows[0]) {
      throw ApiError.notFound(`Admin user with id '${id}' not found`);
    }
    return res.rows[0];
  }

  async updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser> {
    await this.getAdminUserById(id);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(input.name);
    }
    if (input.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(input.email.toLowerCase().trim());
    }
    if (input.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(input.role);
    }
    if (input.mobile !== undefined) {
      fields.push(`mobile = $${idx++}`);
      values.push(input.mobile);
    }
    if (input.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(input.status);
    }

    if (fields.length === 0) {
      return this.getAdminUserById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${idx} 
       RETURNING id, organization_id AS "organizationId", name, email, role, mobile, avatar, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );

    return res.rows[0];
  }

  async deleteAdminUser(id: string): Promise<void> {
    await this.getAdminUserById(id);
    await query(`DELETE FROM admin_users WHERE id = $1`, [id]);
  }
}

export const adminUserService = new AdminUserService();
export const userService = adminUserService; // Alias for backward compatibility

