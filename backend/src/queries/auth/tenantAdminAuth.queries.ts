import { query } from '../dbPool';

export interface TenantAdminUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'tenant_admin';
  roleName?: string | null;
  mobile?: string;
  avatar?: string;
  status: string;
  organizationName: string;
  tenantDbName: string;
  pcIds?: string[];
  acIds?: string[];
  tenantRoleId?: string | null;
  tenantRoleName?: string | null;
  allowedTabs?: any;
  allowedWebTabs?: string[];
  allowedMasterSubTabs?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class TenantAdminAuthQueries {
  static async findTenantAdminByEmail(identifier: string): Promise<TenantAdminUserRecord | null> {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const res = await query(
      `SELECT t.id,
              t.name,
              t.email,
              t.password_hash         AS "passwordHash",
              'tenant_admin'          AS role,
              t.organization_name     AS "roleName",
              t.organization_name     AS "organizationName",
              t.mobile,
              t.avatar,
              t.status,
              t.tenant_db_name        AS "tenantDbName",
              t.pc_ids                AS "pcIds",
              t.ac_ids                AS "acIds",
              t.tenant_role_id        AS "tenantRoleId",
              tr.role_name            AS "tenantRoleName",
              tr.allowed_tabs         AS "allowedTabs",
              COALESCE(tr.allowed_tabs->'webTabs', '["dashboard", "voter_directory", "master_data", "settings"]'::jsonb) AS "allowedWebTabs",
              COALESCE(tr.allowed_tabs->'masterSubTabs', '["acs", "wards", "booths"]'::jsonb) AS "allowedMasterSubTabs",
              t.created_at            AS "createdAt",
              t.updated_at            AS "updatedAt"
       FROM tenants t
       LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
       WHERE LOWER(t.email) = $1 OR t.mobile = $1`,
      [cleanIdentifier]
    );
    return res.rows[0] || null;
  }

  static async findTenantAdminById(id: string): Promise<TenantAdminUserRecord | null> {
    const res = await query(
      `SELECT t.id,
              t.name,
              t.email,
              t.password_hash         AS "passwordHash",
              'tenant_admin'          AS role,
              t.organization_name     AS "roleName",
              t.organization_name     AS "organizationName",
              t.mobile,
              t.avatar,
              t.status,
              t.tenant_db_name        AS "tenantDbName",
              t.pc_ids                AS "pcIds",
              t.ac_ids                AS "acIds",
              t.tenant_role_id        AS "tenantRoleId",
              tr.role_name            AS "tenantRoleName",
              tr.allowed_tabs         AS "allowedTabs",
              COALESCE(tr.allowed_tabs->'webTabs', '["dashboard", "voter_directory", "master_data", "settings"]'::jsonb) AS "allowedWebTabs",
              COALESCE(tr.allowed_tabs->'masterSubTabs', '["acs", "wards", "booths"]'::jsonb) AS "allowedMasterSubTabs",
              t.created_at            AS "createdAt",
              t.updated_at            AS "updatedAt"
       FROM tenants t
       LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
       WHERE t.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }
}
