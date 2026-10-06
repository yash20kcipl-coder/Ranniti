import { query } from './dbPool';
import { CacheService } from '../services/cache.service';
import { TenantPoolManager } from '../utils/tenantPoolManager';
import type { TenantRole, TenantUserRole } from '../models/role.model';

async function executeRoleQuery(sqlStr: string, queryValues: any[] = [], tenantDbName?: string | null) {
  if (tenantDbName && tenantDbName.trim()) {
    return await TenantPoolManager.query(tenantDbName.trim(), sqlStr, queryValues);
  }
  return await query(sqlStr, queryValues);
}

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
       LEFT JOIN tenants ta ON ta.tenant_role_id = tr.id
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
    if (fallbackRes.rows[0]) {
      await query(`UPDATE tenant_roles SET is_default = true WHERE id = $1`, [fallbackRes.rows[0].id]).catch(() => {});
      return { ...fallbackRes.rows[0], isDefault: true };
    }

    // Auto-seed Tier 1 system default role packages if table is completely empty
    try {
      const seededRole = await this.createTenantRole({
        roleName: 'Full Political Campaign Suite',
        description: 'Complete access to all web tabs (incl. settings), tenant master sub-tabs (AC, Ward, Booth), voter directory, and mobile field capabilities.',
        allowedTabs: {
          webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
          masterSubTabs: ['acs', 'wards', 'booths'],
        },
        isActive: true,
        isDefault: true,
      });

      await this.createTenantRole({
        roleName: 'Standard Campaign Package',
        description: 'Access to Dashboard, Voter Directory, Ward & Booth master data, and settings.',
        allowedTabs: {
          webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
          masterSubTabs: ['wards', 'booths'],
        },
        isActive: true,
        isDefault: false,
      });

      await this.createTenantRole({
        roleName: 'Voter Directory & Field Survey Package',
        description: 'Focused package for field operations with Voter Directory and Booth reference access. No settings access.',
        allowedTabs: {
          webTabs: ['dashboard', 'voter_directory'],
          masterSubTabs: ['booths'],
        },
        isActive: true,
        isDefault: false,
      });

      return seededRole;
    } catch {
      return null;
    }
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

  // ─── Tenant Custom User Roles (Tenant DB + Redis) ──────────────────────────

  static async getAllTenantUserRoles(tenantDbName?: string): Promise<TenantUserRole[]> {
    const cacheKey = `ranniti:roles:${tenantDbName || 'master'}`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      let sql: string;
      const params: any[] = [];

      if (tenantDbName && tenantDbName.trim()) {
        sql = `SELECT id, tenant_db_name AS "tenantDbName", role_name AS "roleName",
                      role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs",
                      voter_permissions AS "voterPermissions", can_create_roles AS "canCreateRoles",
                      is_system_default AS "isSystemDefault",
                      created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM tenant_user_roles
               ORDER BY is_system_default DESC, created_at ASC`;
      } else {
        sql = `SELECT id, tenant_db_name AS "tenantDbName", role_name AS "roleName",
                      role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs",
                      voter_permissions AS "voterPermissions", can_create_roles AS "canCreateRoles",
                      is_system_default AS "isSystemDefault",
                      created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM tenant_user_roles
               ORDER BY created_at ASC`;
      }

      const res = await executeRoleQuery(sql, params, tenantDbName);
      return res.rows;
    });
  }

  static async getTenantUserRoleById(id: string, tenantDbName?: string): Promise<TenantUserRole | null> {
    const res = await executeRoleQuery(
      `SELECT id, tenant_db_name AS "tenantDbName", role_name AS "roleName",
              role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs",
              voter_permissions AS "voterPermissions", can_create_roles AS "canCreateRoles",
              is_system_default AS "isSystemDefault",
              created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tenant_user_roles 
       WHERE id = $1`,
      [id],
      tenantDbName
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
    canCreateRoles?: string[];
    isSystemDefault?: boolean;
    createdBy?: string;
  }): Promise<TenantUserRole> {
    const res = await executeRoleQuery(
      `INSERT INTO tenant_user_roles (
        tenant_db_name, role_name, role_key, description, 
        accessible_tabs, voter_permissions, can_create_roles, is_system_default, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, tenant_db_name AS "tenantDbName", role_name AS "roleName",
                 role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs",
                 voter_permissions AS "voterPermissions", can_create_roles AS "canCreateRoles",
                 is_system_default AS "isSystemDefault",
                 created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.tenantDbName || null,
        data.roleName,
        data.roleKey,
        data.description || null,
        JSON.stringify(data.accessibleTabs),
        JSON.stringify(data.voterPermissions),
        JSON.stringify(data.canCreateRoles || []),
        data.isSystemDefault ?? false,
        data.createdBy || null,
      ],
      data.tenantDbName
    );
    await CacheService.del(`ranniti:roles:${data.tenantDbName || 'master'}`);
    return res.rows[0];
  }

  static async updateTenantUserRole(
    id: string,
    data: {
      tenantDbName?: string;
      roleName?: string;
      roleKey?: string;
      description?: string;
      accessibleTabs?: any;
      voterPermissions?: any;
      canCreateRoles?: string[];
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
    if (data.canCreateRoles !== undefined) {
      fields.push(`can_create_roles = $${paramIdx++}`);
      values.push(JSON.stringify(data.canCreateRoles));
    }

    if (fields.length === 0) return this.getTenantUserRoleById(id, data.tenantDbName);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE tenant_user_roles SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING id, tenant_db_name AS "tenantDbName", role_name AS "roleName", role_key AS "roleKey", description, accessible_tabs AS "accessibleTabs", voter_permissions AS "voterPermissions", can_create_roles AS "canCreateRoles", is_system_default AS "isSystemDefault", created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"`;
    const res = await executeRoleQuery(sql, values, data.tenantDbName);
    await CacheService.del(`ranniti:roles:${data.tenantDbName || 'master'}`);
    return res.rows[0] || null;
  }

  static async deleteTenantUserRole(id: string, tenantDbName?: string): Promise<boolean> {
    const res = await executeRoleQuery(
      `DELETE FROM tenant_user_roles WHERE id = $1 AND is_system_default = false`,
      [id],
      tenantDbName
    );
    await CacheService.del(`ranniti:roles:${tenantDbName || 'master'}`);
    return (res.rowCount ?? 0) > 0;
  }
}
