import { query } from './dbPool';
import { Tenant } from '../models/tenant.model';

// ─── Shared SELECT projection (no JOIN to admin_users) ────────────────────────
const TENANT_SELECT = `
  t.id,
  t.name,
  t.email,
  t.password_hash         AS "passwordHash",
  t.mobile,
  t.avatar,
  t.organization_name     AS "organizationName",
  t.tenant_db_name        AS "tenantDbName",
  t.pc_ids                AS "pcIds",
  t.ac_ids                AS "acIds",
  t.tenant_role_id        AS "tenantRoleId",
  tr.role_name            AS "tenantRoleName",
  t.status,
  t.provisioning_progress AS "provisioningProgress",
  t.total_voters_copied   AS "totalVotersCopied",
  t.current_step          AS "currentStep",
  t.error_message         AS "errorMessage",
  t.created_at            AS "createdAt",
  t.updated_at            AS "updatedAt"
`;

export class TenantQueries {
  /**
   * Creates a new row in the tenants table.
   */
  static async createTenant(data: {
    name: string;
    email: string;
    passwordHash: string;
    mobile: string;
    organizationName: string;
    tenantDbName: string;
    pcIds: string[];
    acIds: string[];
    avatar?: string | null;
    tenantRoleId?: string | null;
  }): Promise<Tenant> {
    const res = await query(
      `INSERT INTO tenants
         (name, email, password_hash, mobile, avatar, organization_name, tenant_db_name, pc_ids, ac_ids, tenant_role_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING id`,
      [
        data.name,
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.mobile,
        data.avatar || null,
        data.organizationName,
        data.tenantDbName,
        data.pcIds,
        data.acIds,
        data.tenantRoleId || null,
      ]
    );

    const created = await this.getById(res.rows[0].id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created tenant ${res.rows[0].id}`);
    }
    return created;
  }

  /**
   * Updates provisioning progress and status fields on the tenants table.
   */
  static async updateProvisioningStatus(
    tenantId: string,
    update: {
      status: Tenant['status'];
      provisioningProgress?: number;
      totalVotersCopied?: number;
      errorMessage?: string | null;
      currentStep?: string;
    }
  ): Promise<void> {
    await query(
      `UPDATE tenants
       SET
         status                = $2,
         provisioning_progress = COALESCE($3, provisioning_progress),
         total_voters_copied   = COALESCE($4, total_voters_copied),
         error_message         = $5,
         current_step          = COALESCE($6, current_step),
         updated_at            = NOW()
       WHERE id = $1`,
      [
        tenantId,
        update.status,
        update.provisioningProgress ?? null,
        update.totalVotersCopied ?? null,
        update.errorMessage ?? null,
        update.currentStep ?? null,
      ]
    );
  }

  /**
   * Retrieves a single tenant by primary key.
   */
  static async getById(tenantId: string): Promise<Tenant | null> {
    const res = await query(
      `SELECT ${TENANT_SELECT}
       FROM tenants t
       LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
       WHERE t.id = $1`,
      [tenantId]
    );
    return res.rows[0] || null;
  }

  /**
   * Retrieves a tenant by their login email (case-insensitive).
   */
  static async getByEmail(email: string): Promise<Tenant | null> {
    const res = await query(
      `SELECT ${TENANT_SELECT}
       FROM tenants t
       LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
       WHERE LOWER(t.email) = LOWER($1)`,
      [email]
    );
    return res.rows[0] || null;
  }

  /**
   * Retrieves a tenant by mobile (for login fallback).
   */
  static async getByMobile(mobile: string): Promise<Tenant | null> {
    const res = await query(
      `SELECT ${TENANT_SELECT}
       FROM tenants t
       LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
       WHERE t.mobile = $1`,
      [mobile]
    );
    return res.rows[0] || null;
  }

  /**
   * Retrieves a tenant by tenant_db_name (used internally by provisioning).
   */
  static async getByDbName(tenantDbName: string): Promise<Tenant | null> {
    const res = await query(
      `SELECT ${TENANT_SELECT}
       FROM tenants t
       LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
       WHERE t.tenant_db_name = $1`,
      [tenantDbName]
    );
    return res.rows[0] || null;
  }

  /**
   * Lists all tenants ordered by creation date descending.
   */
  static async getAllTenants(): Promise<Tenant[]> {
    const res = await query(
      `SELECT ${TENANT_SELECT}
       FROM tenants t
       LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
       ORDER BY t.created_at DESC`
    );
    return res.rows;
  }

  /**
   * Updates profile and constituency scope for a tenant.
   */
  static async updateTenant(
    tenantId: string,
    data: {
      name: string;
      email: string;
      mobile: string;
      organizationName: string;
      pcIds: string[];
      acIds: string[];
      tenantRoleId?: string | null;
      avatar?: string | null;
    }
  ): Promise<Tenant | null> {
    await query(
      `UPDATE tenants
       SET name              = $1,
           email             = LOWER(TRIM($2)),
           mobile            = $3,
           organization_name = $4,
           pc_ids            = $5,
           ac_ids            = $6,
           tenant_role_id    = $7,
           avatar            = COALESCE($8, avatar),
           updated_at        = NOW()
       WHERE id = $9`,
      [
        data.name,
        data.email,
        data.mobile,
        data.organizationName,
        data.pcIds,
        data.acIds,
        data.tenantRoleId || null,
        data.avatar ?? null,
        tenantId,
      ]
    );
    return this.getById(tenantId);
  }

  /**
   * Updates tenant status only.
   * Accepted values: pending | provisioning | active | failed | suspended
   */
  static async updateTenantStatus(tenantId: string, status: Tenant['status']): Promise<Tenant | null> {
    await query(
      `UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, tenantId]
    );
    return this.getById(tenantId);
  }

  /**
   * Updates tenant password hash (used by change-password flow).
   */
  static async updateTenantPassword(tenantId: string, passwordHash: string): Promise<void> {
    await query(
      `UPDATE tenants SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, tenantId]
    );
  }

  /**
   * Updates tenant avatar path.
   */
  static async updateTenantAvatar(tenantId: string, avatar: string): Promise<void> {
    await query(
      `UPDATE tenants SET avatar = $1, updated_at = NOW() WHERE id = $2`,
      [avatar, tenantId]
    );
  }

  /**
   * Deletes a tenant by ID.
   */
  static async deleteTenant(tenantId: string): Promise<void> {
    await query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
  }
}
