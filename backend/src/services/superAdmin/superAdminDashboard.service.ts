import { Request } from 'express';
import { dbPool } from '../../queries/dbPool';
import {
  SuperAdminDashboardQueries,
  TenantOverviewMetrics,
  ElectoralInfrastructureCounts,
  VoterDemographicMetrics,
  RecentTenantRecord,
  RecentAuditRecord,
} from '../../queries/superAdminDashboard.queries';
import { attachFileUrls } from '../../utils/fileUrl';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { importJobTracker, ImportJob } from '../importJobTracker';

export interface PlatformHealthMetrics {
  masterPoolTotal: number;
  masterPoolIdle: number;
  masterPoolWaiting: number;
  activeTenantPools: number;
  uptimeSeconds: number;
}

export interface SuperAdminDashboardData {
  tenants: TenantOverviewMetrics;
  infrastructure: ElectoralInfrastructureCounts;
  voters: VoterDemographicMetrics;
  platformHealth: PlatformHealthMetrics;
  recentTenants: RecentTenantRecord[];
  activeImportsCount: number;
  recentAuditFeed: RecentAuditRecord[];
}

export class SuperAdminDashboardService {
  /**
   * Fetches aggregated platform metrics, infrastructure counts, demographics,
   * active pool diagnostics, recent tenants, and recent audit feed in parallel.
   */
  static async getPlatformMetrics(req?: Request): Promise<SuperAdminDashboardData> {
    const [
      tenants,
      infrastructure,
      voters,
      recentTenantsRaw,
      recentAuditFeed,
    ] = await Promise.all([
      SuperAdminDashboardQueries.getTenantOverview(),
      SuperAdminDashboardQueries.getElectoralInfrastructureCounts(),
      SuperAdminDashboardQueries.getVoterDemographics(),
      SuperAdminDashboardQueries.getRecentTenants(5),
      SuperAdminDashboardQueries.getRecentAuditLogs(8),
    ]);

    // Format avatar URLs with base URL per Rule 1
    const recentTenants = attachFileUrls(recentTenantsRaw, ['avatar'], req);

    // Live PostgreSQL pool metrics
    const platformHealth: PlatformHealthMetrics = {
      masterPoolTotal: dbPool.totalCount || 0,
      masterPoolIdle: dbPool.idleCount || 0,
      masterPoolWaiting: dbPool.waitingCount || 0,
      activeTenantPools: TenantPoolManager.getActivePoolsCount(),
      uptimeSeconds: Math.floor(process.uptime()),
    };

    const allImports = importJobTracker.getAllJobs();
    const activeImportsCount = allImports.filter(
      (job) => job.status === 'processing' || job.status === 'pending'
    ).length;

    return {
      tenants,
      infrastructure,
      voters,
      platformHealth,
      recentTenants,
      activeImportsCount,
      recentAuditFeed,
    };
  }

  /**
   * Returns all active and recent bulk import jobs from ImportJobTracker.
   */
  static getImportJobs(): ImportJob[] {
    return importJobTracker.getAllJobs();
  }

  /**
   * Returns recent security audit logs.
   */
  static async getAuditFeed(limit = 20): Promise<RecentAuditRecord[]> {
    return SuperAdminDashboardQueries.getRecentAuditLogs(limit);
  }
}
