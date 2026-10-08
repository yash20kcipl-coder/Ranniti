import { query } from './dbPool';

export interface TenantOverviewMetrics {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  suspendedTenants: number;
  totalVotersCopied: number;
}

export interface ElectoralInfrastructureCounts {
  statesCount: number;
  pcsCount: number;
  acsCount: number;
  wardsCount: number;
  boothsCount: number;
  partiesCount: number;
  religionsCount: number;
  castesCount: number;
}

export interface VoterDemographicMetrics {
  totalVoters: number;
  maleVoters: number;
  femaleVoters: number;
  otherVoters: number;
}

export interface RecentTenantRecord {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  organizationName: string;
  tenantDbName: string;
  status: string;
  currentStep: string | null;
  currentPhase: string | null;
  provisioningProgress: number;
  totalVotersCopied: number;
  createdAt: string;
  roleName: string | null;
}

export interface RecentAuditRecord {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export class SuperAdminDashboardQueries {
  /**
   * Aggregate total tenant counts, active/pending/suspended breakdown, and total voters copied.
   */
  static async getTenantOverview(): Promise<TenantOverviewMetrics> {
    const sql = `
      SELECT 
        COUNT(*)::int AS "totalTenants",
        COUNT(*) FILTER (WHERE status = 'active')::int AS "activeTenants",
        COUNT(*) FILTER (WHERE status = 'pending')::int AS "pendingTenants",
        COUNT(*) FILTER (WHERE status = 'suspended')::int AS "suspendedTenants",
        COALESCE(SUM(total_voters_copied), 0)::bigint AS "totalVotersCopied"
      FROM tenants;
    `;
    const res = await query(sql);
    const row = res.rows[0] || {};
    return {
      totalTenants: Number(row.totalTenants || 0),
      activeTenants: Number(row.activeTenants || 0),
      pendingTenants: Number(row.pendingTenants || 0),
      suspendedTenants: Number(row.suspendedTenants || 0),
      totalVotersCopied: Number(row.totalVotersCopied || 0),
    };
  }

  /**
   * Aggregate master electoral infrastructure counts.
   */
  static async getElectoralInfrastructureCounts(): Promise<ElectoralInfrastructureCounts> {
    const sql = `
      SELECT 
        (SELECT COUNT(*)::int FROM states) AS "statesCount",
        (SELECT COUNT(*)::int FROM parliamentary_constituencies) AS "pcsCount",
        (SELECT COUNT(*)::int FROM assembly_constituencies) AS "acsCount",
        (SELECT COUNT(*)::int FROM wards) AS "wardsCount",
        (SELECT COUNT(*)::int FROM booths) AS "boothsCount",
        (SELECT COUNT(*)::int FROM parties) AS "partiesCount",
        (SELECT COUNT(*)::int FROM religions) AS "religionsCount",
        (SELECT COUNT(*)::int FROM castes) AS "castesCount";
    `;
    const res = await query(sql);
    const row = res.rows[0] || {};
    return {
      statesCount: Number(row.statesCount || 0),
      pcsCount: Number(row.pcsCount || 0),
      acsCount: Number(row.acsCount || 0),
      wardsCount: Number(row.wardsCount || 0),
      boothsCount: Number(row.boothsCount || 0),
      partiesCount: Number(row.partiesCount || 0),
      religionsCount: Number(row.religionsCount || 0),
      castesCount: Number(row.castesCount || 0),
    };
  }

  /**
   * Aggregate master voter totals and gender demographics.
   */
  static async getVoterDemographics(): Promise<VoterDemographicMetrics> {
    const sql = `
      SELECT 
        COUNT(*)::bigint AS "totalVoters",
        COUNT(*) FILTER (WHERE LOWER(gender) IN ('male', 'm'))::bigint AS "maleVoters",
        COUNT(*) FILTER (WHERE LOWER(gender) IN ('female', 'f'))::bigint AS "femaleVoters",
        COUNT(*) FILTER (WHERE LOWER(gender) NOT IN ('male', 'female', 'm', 'f'))::bigint AS "otherVoters"
      FROM voters;
    `;
    const res = await query(sql);
    const row = res.rows[0] || {};
    return {
      totalVoters: Number(row.totalVoters || 0),
      maleVoters: Number(row.maleVoters || 0),
      femaleVoters: Number(row.femaleVoters || 0),
      otherVoters: Number(row.otherVoters || 0),
    };
  }

  /**
   * Fetch the most recent tenant accounts with current provisioning status.
   */
  static async getRecentTenants(limit = 5): Promise<RecentTenantRecord[]> {
    const sql = `
      SELECT 
        t.id, 
        t.name, 
        t.email, 
        t.avatar,
        t.organization_name AS "organizationName",
        t.tenant_db_name AS "tenantDbName", 
        t.status, 
        t.current_step AS "currentStep",
        t.current_phase AS "currentPhase",
        t.provisioning_progress AS "provisioningProgress", 
        t.total_voters_copied AS "totalVotersCopied",
        t.created_at AS "createdAt", 
        tr.role_name AS "roleName"
      FROM tenants t
      LEFT JOIN tenant_roles tr ON tr.id = t.tenant_role_id
      ORDER BY t.created_at DESC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      organizationName: row.organizationName,
      tenantDbName: row.tenantDbName,
      status: row.status,
      currentStep: row.currentStep,
      currentPhase: row.currentPhase,
      provisioningProgress: Number(row.provisioningProgress || 0),
      totalVotersCopied: Number(row.totalVotersCopied || 0),
      createdAt: row.createdAt,
      roleName: row.roleName,
    }));
  }

  /**
   * Fetch recent security audit events from audit_logs.
   */
  static async getRecentAuditLogs(limit = 8): Promise<RecentAuditRecord[]> {
    try {
      const sql = `
        SELECT 
          al.id, 
          al.action, 
          al.entity_type AS "entityType", 
          al.entity_id AS "entityId",
          al.details, 
          al.ip_address AS "ipAddress", 
          al.created_at AS "createdAt",
          COALESCE(u.name, 'System') AS "userName", 
          COALESCE(u.email, 'system@ranniti.internal') AS "userEmail"
        FROM audit_logs al
        LEFT JOIN admin_users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT $1;
      `;
      const res = await query(sql, [limit]);
      return res.rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        details: row.details,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt,
        userName: row.userName,
        userEmail: row.userEmail,
      }));
    } catch {
      return [];
    }
  }
}
