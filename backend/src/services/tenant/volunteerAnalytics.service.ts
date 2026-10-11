import { TenantPoolManager } from '../pool/tenantPoolManager';
import { logger } from '../../utils/logger';

export interface VolunteerKpiStats {
  totalContactsSynced: number;
  totalCallsInitiated: number;
  totalWhatsAppSent: number;
  totalSmsSent: number;
  totalVoterTouches: number;
  activeVolunteersCount: number;
  totalVolunteersCount: number;
}

export interface VolunteerRoleBreakdownItem {
  role: string;
  roleName: string;
  volunteerCount: number;
  contactsSynced: number;
  callsInitiated: number;
  whatsAppSent: number;
  totalTouches: number;
}

export interface VolunteerLeaderboardItem {
  id: string;
  name: string;
  mobile: string;
  avatar: string | null;
  role: string;
  roleName: string;
  assignedBoothsCount: number;
  contactsSynced: number;
  callsCount: number;
  whatsAppCount: number;
  smsCount: number;
  totalTouches: number;
  engagementScore: number;
}

export interface VolunteerAnalyticsResult {
  timeRange: '7d' | '30d' | 'all';
  kpis: VolunteerKpiStats;
  roleBreakdown: VolunteerRoleBreakdownItem[];
  leaderboard: VolunteerLeaderboardItem[];
}

export interface VolunteerAnalyticsFilters {
  timeRange?: '7d' | '30d' | 'all';
  role?: string;
  boothId?: string;
}

export class VolunteerAnalyticsService {
  /**
   * Aggregates volunteer outreach performance across contact syncs, calls, and WhatsApp messages.
   */
  async getVolunteerAnalytics(
    tenantDbName: string,
    filters: VolunteerAnalyticsFilters = {}
  ): Promise<VolunteerAnalyticsResult> {
    const timeRange = filters.timeRange || '30d';

    let timeIntervalClause = '';
    if (timeRange === '7d') {
      timeIntervalClause = "NOW() - INTERVAL '7 days'";
    } else if (timeRange === '30d') {
      timeIntervalClause = "NOW() - INTERVAL '30 days'";
    }

    const syncTimeFilter = timeIntervalClause ? `WHERE synced_at >= ${timeIntervalClause}` : '';
    const actTimeFilter = timeIntervalClause ? `WHERE created_at >= ${timeIntervalClause}` : '';

    const conditions: string[] = ["u.status = 'active'"];
    const params: any[] = [];
    let paramIdx = 1;

    if (filters.role && filters.role.trim() && filters.role !== 'all') {
      conditions.push(`u.role = $${paramIdx}`);
      params.push(filters.role.trim());
      paramIdx++;
    }

    if (filters.boothId && filters.boothId.trim() && filters.boothId !== 'all') {
      conditions.push(`EXISTS (SELECT 1 FROM user_booth_assignments uba WHERE uba.user_id = u.id AND uba.booth_id = $${paramIdx}::uuid)`);
      params.push(filters.boothId.trim());
      paramIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sql = `
      WITH sync_counts AS (
        SELECT 
          user_id AS volunteer_id,
          COUNT(DISTINCT voter_id) AS contacts_synced
        FROM user_synced_contacts
        ${syncTimeFilter}
        GROUP BY user_id
      ),
      activity_counts AS (
        SELECT 
          volunteer_id,
          COUNT(*) FILTER (WHERE activity_type = 'call') AS calls_count,
          COUNT(*) FILTER (WHERE activity_type = 'whatsapp') AS whatsapp_count,
          COUNT(*) FILTER (WHERE activity_type = 'sms') AS sms_count
        FROM volunteer_activity_logs
        ${actTimeFilter}
        GROUP BY volunteer_id
      ),
      booth_counts AS (
        SELECT 
          user_id AS volunteer_id,
          COUNT(DISTINCT booth_id) AS assigned_booths_count
        FROM user_booth_assignments
        GROUP BY user_id
      )
      SELECT 
        u.id,
        u.name,
        u.mobile,
        u.avatar,
        u.role,
        COALESCE(u.role_name, u.role) AS "roleName",
        COALESCE(sc.contacts_synced, 0)::int AS "contactsSynced",
        COALESCE(ac.calls_count, 0)::int AS "callsCount",
        COALESCE(ac.whatsapp_count, 0)::int AS "whatsAppCount",
        COALESCE(ac.sms_count, 0)::int AS "smsCount",
        COALESCE(bc.assigned_booths_count, 0)::int AS "assignedBoothsCount",
        (COALESCE(sc.contacts_synced, 0) + COALESCE(ac.calls_count, 0) + COALESCE(ac.whatsapp_count, 0) + COALESCE(ac.sms_count, 0))::int AS "totalTouches"
      FROM tenant_users u
      LEFT JOIN sync_counts sc ON sc.volunteer_id = u.id
      LEFT JOIN activity_counts ac ON ac.volunteer_id = u.id
      LEFT JOIN booth_counts bc ON bc.volunteer_id = u.id
      ${whereClause}
      ORDER BY "totalTouches" DESC, "contactsSynced" DESC, u.name ASC;
    `;

    try {
      const res = await TenantPoolManager.query(tenantDbName, sql, params);
      const rows = res.rows || [];

      let totalContactsSynced = 0;
      let totalCallsInitiated = 0;
      let totalWhatsAppSent = 0;
      let totalSmsSent = 0;
      let activeVolunteersCount = 0;

      const roleMap: Record<string, VolunteerRoleBreakdownItem> = {};

      let maxTouches = 1;
      for (const row of rows) {
        if (row.totalTouches > maxTouches) {
          maxTouches = row.totalTouches;
        }
        totalContactsSynced += row.contactsSynced;
        totalCallsInitiated += row.callsCount;
        totalWhatsAppSent += row.whatsAppCount;
        totalSmsSent += row.smsCount;

        if (row.totalTouches > 0) {
          activeVolunteersCount++;
        }

        // Aggregate by role
        const rKey = row.role || 'other';
        if (!roleMap[rKey]) {
          roleMap[rKey] = {
            role: rKey,
            roleName: row.roleName || rKey,
            volunteerCount: 0,
            contactsSynced: 0,
            callsInitiated: 0,
            whatsAppSent: 0,
            totalTouches: 0,
          };
        }
        roleMap[rKey].volunteerCount += 1;
        roleMap[rKey].contactsSynced += row.contactsSynced;
        roleMap[rKey].callsInitiated += row.callsCount;
        roleMap[rKey].whatsAppSent += row.whatsAppCount;
        roleMap[rKey].totalTouches += row.totalTouches;
      }

      const totalVoterTouches = totalContactsSynced + totalCallsInitiated + totalWhatsAppSent + totalSmsSent;

      const leaderboard: VolunteerLeaderboardItem[] = rows.map((r) => {
        const score = maxTouches > 0 ? Math.round((r.totalTouches / maxTouches) * 100) : 0;
        return {
          id: r.id,
          name: r.name,
          mobile: r.mobile,
          avatar: r.avatar,
          role: r.role,
          roleName: r.roleName,
          assignedBoothsCount: r.assignedBoothsCount,
          contactsSynced: r.contactsSynced,
          callsCount: r.callsCount,
          whatsAppCount: r.whatsAppCount,
          smsCount: r.smsCount,
          totalTouches: r.totalTouches,
          engagementScore: score,
        };
      });

      const roleBreakdown = Object.values(roleMap).sort((a, b) => b.totalTouches - a.totalTouches);

      return {
        timeRange,
        kpis: {
          totalContactsSynced,
          totalCallsInitiated,
          totalWhatsAppSent,
          totalSmsSent,
          totalVoterTouches,
          activeVolunteersCount,
          totalVolunteersCount: rows.length,
        },
        roleBreakdown,
        leaderboard,
      };
    } catch (err) {
      logger.error(`Error querying volunteer analytics for tenant '${tenantDbName}':`, err);
      throw err;
    }
  }
}

export const volunteerAnalyticsService = new VolunteerAnalyticsService();
