import { query } from './dbPool';
import { TenantAssignment } from '../models/tenant.model';

export class TenantQueries {
  /**
   * Creates a new tenant_assignments row after a tenant user account is created.
   */
  static async createTenantAssignment(data: {
    userId: string;
    organizationName: string;
    tenantDbName: string;
    pcIds: string[];
    acIds: string[];
    tenantRoleId?: string | null;
  }): Promise<TenantAssignment> {
    const res = await query(
      `INSERT INTO tenant_assignments
         (user_id, organization_name, tenant_db_name, pc_ids, ac_ids, tenant_role_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING
         id,
         user_id               AS "userId",
         organization_name     AS "organizationName",
         tenant_db_name        AS "tenantDbName",
         pc_ids                AS "pcIds",
         ac_ids                AS "acIds",
         tenant_role_id        AS "tenantRoleId",
         status,
         provisioning_progress AS "provisioningProgress",
         total_voters_copied   AS "totalVotersCopied",
         error_message         AS "errorMessage",
         created_at            AS "createdAt",
         updated_at            AS "updatedAt"`,
      [
        data.userId,
        data.organizationName,
        data.tenantDbName,
        data.pcIds,
        data.acIds,
        data.tenantRoleId || null,
      ]
    );
    return res.rows[0];
  }

  /**
   * Updates provisioning progress and status.
   */
  static async updateProvisioningStatus(
    userId: string,
    update: {
      status: TenantAssignment['status'];
      provisioningProgress?: number;
      totalVotersCopied?: number;
      errorMessage?: string | null;
      currentStep?: string;
    }
  ): Promise<void> {
    await query(
      `UPDATE tenant_assignments
       SET
         status                = CASE WHEN status IN ('active', 'failed') AND $2 = 'provisioning' THEN status ELSE $2 END,
         provisioning_progress = COALESCE($3, provisioning_progress),
         total_voters_copied   = COALESCE($4, total_voters_copied),
         error_message         = $5,
         current_step          = COALESCE($6, current_step),
         updated_at            = NOW()
       WHERE user_id = $1`,
      [
        userId,
        update.status,
        update.provisioningProgress ?? null,
        update.totalVotersCopied ?? null,
        update.errorMessage ?? null,
        update.currentStep ?? null,
      ]
    );
  }

  /**
   * Retrieves a tenant assignment by user_id.
   */
  static async getByUserId(userId: string): Promise<TenantAssignment | null> {
    const res = await query(
      `SELECT
         id,
         user_id               AS "userId",
         organization_name     AS "organizationName",
         tenant_db_name        AS "tenantDbName",
         pc_ids                AS "pcIds",
         ac_ids                AS "acIds",
         tenant_role_id        AS "tenantRoleId",
         status,
         provisioning_progress AS "provisioningProgress",
         total_voters_copied   AS "totalVotersCopied",
         error_message         AS "errorMessage",
         created_at            AS "createdAt",
         updated_at            AS "updatedAt"
       FROM tenant_assignments
       WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Updates tenant_db_name on admin_users table.
   */
  static async updateUserTenantDbName(userId: string, tenantDbName: string): Promise<void> {
    await query(
      `UPDATE admin_users SET tenant_db_name = $2, updated_at = NOW() WHERE id = $1`,
      [userId, tenantDbName]
    );
  }

  /**
   * Retrieves a single tenant user with joined assignment details by user ID.
   */
  static async getTenantUserByUserId(userId: string): Promise<any | null> {
    const res = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.mobile,
         u.avatar,
         u.status                         AS "accountStatus",
         u.tenant_db_name                 AS "tenantDbName",
         u.created_at                     AS "createdAt",
         u.updated_at                     AS "updatedAt",
         ta.id                            AS "assignmentId",
         ta.organization_name             AS "organizationName",
         ta.pc_ids                        AS "pcIds",
         ta.ac_ids                        AS "acIds",
         ta.tenant_role_id                AS "tenantRoleId",
         tr.role_name                     AS "tenantRoleName",
         ta.status                        AS "provisioningStatus",
         ta.provisioning_progress         AS "provisioningProgress",
         ta.total_voters_copied           AS "totalVotersCopied",
         ta.current_step                  AS "currentStep",
         ta.error_message                 AS "errorMessage"
       FROM admin_users u
       LEFT JOIN tenant_assignments ta ON ta.user_id = u.id
       LEFT JOIN tenant_roles tr ON tr.id = ta.tenant_role_id
       WHERE u.id = $1 AND u.role = 'tenant_admin'`,
      [userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Lists all tenant users with their assignment details.
   */
  static async getAllTenantUsers(): Promise<any[]> {
    const res = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.mobile,
         u.avatar,
         u.status                         AS "accountStatus",
         u.tenant_db_name                 AS "tenantDbName",
         u.created_at                     AS "createdAt",
         u.updated_at                     AS "updatedAt",
         ta.id                            AS "assignmentId",
         ta.organization_name             AS "organizationName",
         ta.pc_ids                        AS "pcIds",
         ta.ac_ids                        AS "acIds",
         ta.tenant_role_id                AS "tenantRoleId",
         tr.role_name                     AS "tenantRoleName",
         ta.status                        AS "provisioningStatus",
         ta.provisioning_progress         AS "provisioningProgress",
         ta.total_voters_copied           AS "totalVotersCopied",
         ta.current_step                  AS "currentStep",
         ta.error_message                 AS "errorMessage"
       FROM admin_users u
       LEFT JOIN tenant_assignments ta ON ta.user_id = u.id
       LEFT JOIN tenant_roles tr ON tr.id = ta.tenant_role_id
       WHERE u.role = 'tenant_admin'
       ORDER BY u.created_at DESC`
    );
    return res.rows;
  }

  /**
   * Updates profile and assignment details for a tenant user.
   */
  static async updateTenantUser(
    userId: string,
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
  ): Promise<any> {
    await query(
      `UPDATE admin_users
       SET name = $1, email = $2, mobile = $3, avatar = COALESCE($4, avatar), updated_at = NOW()
       WHERE id = $5 AND role = 'tenant_admin'`,
      [data.name, data.email, data.mobile, data.avatar ?? null, userId]
    );

    await query(
      `UPDATE tenant_assignments
       SET organization_name = $1, pc_ids = $2, ac_ids = $3, tenant_role_id = $4, updated_at = NOW()
       WHERE user_id = $5`,
      [data.organizationName, data.pcIds, data.acIds, data.tenantRoleId || null, userId]
    );

    return this.getTenantUserByUserId(userId);
  }

  /**
   * Updates account status for a tenant user (active, inactive, suspended).
   * admin_users.status accepts: active | inactive | suspended
   * tenant_assignments.status accepts: pending | provisioning | active | failed | suspended
   * 'inactive' is account-level only — maps to 'suspended' in tenant_assignments.
   */
  static async updateTenantStatus(userId: string, status: string): Promise<any> {
    await query(
      `UPDATE admin_users SET status = $1, updated_at = NOW() WHERE id = $2 AND role = 'tenant_admin'`,
      [status, userId]
    );

    // Map to the nearest valid provisioning status for tenant_assignments
    const provisioningStatus = status === 'inactive' ? 'suspended' : status;
    await query(
      `UPDATE tenant_assignments SET status = $1, updated_at = NOW() WHERE user_id = $2`,
      [provisioningStatus, userId]
    );

    return this.getTenantUserByUserId(userId);
  }

  /**
   * Deletes tenant assignment and tenant admin user.
   */
  static async deleteTenantUser(userId: string): Promise<void> {
    await query(`DELETE FROM tenant_assignments WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM admin_users WHERE id = $1 AND role = 'tenant_admin'`, [userId]);
  }
}

