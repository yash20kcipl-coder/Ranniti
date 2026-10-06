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
  createdAt: Date;
  updatedAt: Date;
}

export class TenantAdminAuthQueries {
  static async findTenantAdminByEmail(identifier: string): Promise<TenantAdminUserRecord | null> {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const res = await query(
      `SELECT id,
              name,
              email,
              password_hash         AS "passwordHash",
              'tenant_admin'        AS role,
              organization_name     AS "roleName",
              organization_name     AS "organizationName",
              mobile,
              avatar,
              status,
              tenant_db_name        AS "tenantDbName",
              pc_ids                AS "pcIds",
              ac_ids                AS "acIds",
              created_at            AS "createdAt",
              updated_at            AS "updatedAt"
       FROM tenants
       WHERE LOWER(email) = $1 OR mobile = $1`,
      [cleanIdentifier]
    );
    return res.rows[0] || null;
  }

  static async findTenantAdminById(id: string): Promise<TenantAdminUserRecord | null> {
    const res = await query(
      `SELECT id,
              name,
              email,
              password_hash         AS "passwordHash",
              'tenant_admin'        AS role,
              organization_name     AS "roleName",
              organization_name     AS "organizationName",
              mobile,
              avatar,
              status,
              tenant_db_name        AS "tenantDbName",
              pc_ids                AS "pcIds",
              ac_ids                AS "acIds",
              created_at            AS "createdAt",
              updated_at            AS "updatedAt"
       FROM tenants
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }
}
