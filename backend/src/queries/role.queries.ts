import { query } from './dbPool';
import type { TenantRole, TenantUserRole } from '../models/role.model';

export class RoleQueries {
  // ─── Super Admin Tenant Role Packages ──────────────────────────────────────

  static async getAllTenantRoles(): Promise<TenantRole[]> {
    const res = await query(
      `SELECT tr.id, tr.role_name AS "roleName", tr.description, 
              tr.allowed_tabs AS "allowedTabs", tr.is_active AS "isActive",
              tr.is_default AS "isDefault",
              COALESCE(COUNT(ta.id), 0)::int AS "tenantCount",
              tr.created_at AS "createdAt", tr.updated_at AS "updatedAt"
       FROM tenant_roles tr
       LEFT JOIN tenant_assignments ta ON ta.tenant_role_id = tr.id
       GROUP BY tr.id
       ORDER BY tr.is_default DESC, tr.created_at DESC`
    );
    return res.rows;
  }

  static async getTenantRoleById(id: string): Promise<TenantRole | null> {
    const res = await query(
      `SELECT id, role_name AS "roleName", description, 
              allowed_tabs AS "allowedTabs", is_active AS "isActive",
              is_default AS "isDefault",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tenant_roles 
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async getDefaultTenantRole(): Promise<TenantRole | null> {
    const res = await query(
      `SELECT id, role_name AS "roleName", description, 
              allowed_tabs AS "allowedTabs", is_active AS "isActive",
              is_default AS "isDefault",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tenant_roles 
       WHERE is_default = true AND is_active = true 
       LIMIT 1`
    );
    if (res.rows[0]) return res.rows[0];

    // Fallback to first active tenant role if no role marked default
    const fallbackRes = await query(
      `SELECT id, role_name AS "roleName", description, 
              allowed_tabs AS "allowedTabs", is_active AS "isActive",
              is_default AS "isDefault",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tenant_roles 
       WHERE is_active = true 
       ORDER BY created_at ASC 
       LIMIT 1`
    );
    return fallbackRes.rows[0] || null;
  }

  static async setDefaultTenantRole(id: string): Promise<TenantRole | null> {
    await query(`UPDATE tenant_roles SET is_default = false WHERE is_default = true`);
    const res = await query(
      `UPDATE tenant_roles 
       SET is_default = true, is_active = true, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, role_name AS "roleName", description, 
                 allowed_tabs AS "allowedTabs", is_active AS "isActive",
                 is_default AS "isDefault",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createTenantRole(data: {
    roleName: string;
    description?: string;
    allowedTabs: any;
    isActive?: boolean;
    isDefault?: boolean;
  }): Promise<TenantRole> {
    if (data.isDefault) {
      await query(`UPDATE tenant_roles SET is_default = false WHERE is_default = true`);
    }

    const res = await query(
      `INSERT INTO tenant_roles (role_name, description, allowed_tabs, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, role_name AS "roleName", description, 
                 allowed_tabs AS "allowedTabs", is_active AS "isActive",
                 is_default AS "isDefault",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.roleName,
        data.description || null,
        JSON.stringify(data.allowedTabs),
        data.isActive ?? true,
        data.isDefault ?? false,
      ]
    );
    return res.rows[0];
  }

  static async updateTenantRole(
    id: string,
    data: {
      roleName?: string;
      description?: string;
      allowedTabs?: any;
      isActive?: boolean;
      isDefault?: boolean;
    }
  ): Promise<TenantRole | null> {
    if (data.isDefault) {
      await query(`UPDATE tenant_roles SET is_default = false WHERE id != $1`, [id]);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (data.roleName !== undefined) {
      fields.push(`role_name = $${paramIdx++}`);
      values.push(data.roleName);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIdx++}`);
      values.push(data.description);
    }
    if (data.allowedTabs !== undefined) {
      fields.push(`allowed_tabs = $${paramIdx++}`);
      values.push(JSON.stringify(data.allowedTabs));
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIdx++}`);
      values.push(data.isActive);
    }
    if (data.isDefault !== undefined) {
      fields.push(`is_default = $${paramIdx++}`);
      values.push(data.isDefault);
    }

    if (fields.length === 0) return this.getTenantRoleById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE tenant_roles SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING id, role_name AS "roleName", description, allowed_tabs AS "allowedTabs", is_active AS "isActive", is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt"`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  }

  static async deleteTenantRole(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM tenant_roles WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ─── Tenant Custom User Roles ─────────────────────────────────────────────

  static async getAllTenantUserRoles(tenantDbName?: string): Promise<TenantUserRole[]> {
    let sql = `SELECT id, tenant_db_name AS "tenantDbName", role_name AS "roleName",
                      role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs",
                      voter_permissions AS "voterPermissions", is_system_default AS "isSystemDefault",
                      created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM tenant_user_roles`;
    const params: any[] = [];

    if (tenantDbName) {
      sql += ` WHERE tenant_db_name = $1 OR tenant_db_name IS NULL ORDER BY created_at ASC`;
      params.push(tenantDbName);
    } else {
      sql += ` ORDER BY created_at ASC`;
    }

    const res = await query(sql, params);
    return res.rows;
  }

  static async getTenantUserRoleById(id: string): Promise<TenantUserRole | null> {
    const res = await query(
      `SELECT id, tenant_db_name AS "tenantDbName", role_name AS "roleName",
              role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs",
              voter_permissions AS "voterPermissions", is_system_default AS "isSystemDefault",
              created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tenant_user_roles 
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createTenantUserRole(data: {
    tenantDbName?: string;
    roleName: string;
    roleKey: string;
    description?: string;
    accessibleTabs: any;
    voterPermissions: any;
    isSystemDefault?: boolean;
    createdBy?: string;
  }): Promise<TenantUserRole> {
    const res = await query(
      `INSERT INTO tenant_user_roles (
        tenant_db_name, role_name, role_key, description, 
        accessible_tabs, voter_permissions, is_system_default, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, tenant_db_name AS "tenantDbName", role_name AS "roleName",
                 role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs",
                 voter_permissions AS "voterPermissions", is_system_default AS "isSystemDefault",
                 created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.tenantDbName || null,
        data.roleName,
        data.roleKey,
        data.description || null,
        JSON.stringify(data.accessibleTabs),
        JSON.stringify(data.voterPermissions),
        data.isSystemDefault ?? false,
        data.createdBy || null,
      ]
    );
    return res.rows[0];
  }

  static async updateTenantUserRole(
    id: string,
    data: {
      roleName?: string;
      roleKey?: string;
      description?: string;
      accessibleTabs?: any;
      voterPermissions?: any;
    }
  ): Promise<TenantUserRole | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (data.roleName !== undefined) {
      fields.push(`role_name = $${paramIdx++}`);
      values.push(data.roleName);
    }
    if (data.roleKey !== undefined) {
      fields.push(`role_key = $${paramIdx++}`);
      values.push(data.roleKey);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIdx++}`);
      values.push(data.description);
    }
    if (data.accessibleTabs !== undefined) {
      fields.push(`accessible_tabs = $${paramIdx++}`);
      values.push(JSON.stringify(data.accessibleTabs));
    }
    if (data.voterPermissions !== undefined) {
      fields.push(`voter_permissions = $${paramIdx++}`);
      values.push(JSON.stringify(data.voterPermissions));
    }

    if (fields.length === 0) return this.getTenantUserRoleById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE tenant_user_roles SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING id, tenant_db_name AS "tenantDbName", role_name AS "roleName", role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs", voter_permissions AS "voterPermissions", is_system_default AS "isSystemDefault", created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  }

  static async deleteTenantUserRole(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM tenant_user_roles WHERE id = $1 AND is_system_default = false`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
