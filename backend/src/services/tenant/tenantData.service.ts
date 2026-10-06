import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../cache.service';
import { query as mainQuery } from '../../queries/dbPool';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';

export interface TenantProfile {
  userId: string;
  name: string;
  email: string;
  role: string;
  tenantDbName: string | null;
  organizationName?: string;
  assignedPcIds?: string[];
  assignedAcIds?: string[];
  status?: string;
}

export interface TenantStats {
  tenantDbName: string;
  totalVoters: number;
  totalBooths: number;
  totalVolunteers: number;
  acBreakdown: Array<{ acId: string; acName: string; voterCount: number }>;
}

export class TenantDataService {
  /**
   * Retrieves profile details and assigned scope for the logged-in tenant user
   */
  async getTenantProfile(userId: string): Promise<TenantProfile> {
    return CacheService.getOrSet(`ranniti:tenant:profile:${userId}`, 3600, async () => {
      const userRes = await mainQuery(
        `SELECT t.id, t.name, t.email, 'tenant_admin' AS role, t.status, t.tenant_db_name,
                t.organization_name, t.pc_ids, t.ac_ids
         FROM tenants t
         WHERE t.id = $1`,
        [userId]
      );

      if (userRes.rows.length === 0) {
        throw ApiError.notFound('Tenant user profile not found');
      }

      const row = userRes.rows[0];
      return {
        userId: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        tenantDbName: row.tenant_db_name,
        organizationName: row.organization_name || 'Ranniti Tenant Campaign',
        assignedPcIds: row.pc_ids || [],
        assignedAcIds: row.ac_ids || [],
      };
    });
  }

  /**
   * Queries real-time campaign statistics directly from the tenant's isolated database
   */
  async getTenantStats(userId: string, tenantDbName: string | null): Promise<TenantStats> {
    if (!tenantDbName) {
      throw ApiError.badRequest('No tenant database is assigned to this user account');
    }

    return CacheService.getOrSet(`ranniti:tenant:stats:${tenantDbName}`, 600, async () => {
      const tenantPool = getTenantDbPool(tenantDbName);

      try {
        // 1. Total voters in tenant DB
        const votersCountRes = await tenantPool.query(`SELECT COUNT(*)::int as total FROM voters`);
        const totalVoters = votersCountRes.rows[0]?.total || 0;

        // 2. Total polling booths in tenant DB
        let totalBooths = 0;
        try {
          const boothsCountRes = await tenantPool.query(`SELECT COUNT(*)::int as total FROM booths`);
          totalBooths = boothsCountRes.rows[0]?.total || 0;
        } catch {
          const distBoothRes = await tenantPool.query(`SELECT COUNT(DISTINCT booth_id)::int as total FROM voters WHERE booth_id IS NOT NULL`);
          totalBooths = distBoothRes.rows[0]?.total || 0;
        }

        // 3. Total active volunteers assigned to this tenant
        const volunteersCountRes = await tenantPool.query(
          `SELECT COUNT(*)::int as total FROM tenant_users WHERE role IN ('pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter')`
        );
        const totalVolunteers = volunteersCountRes.rows[0]?.total || 0;

        // 4. AC-wise breakdown in tenant DB
        let acBreakdown: Array<{ acId: string; acName: string; voterCount: number }> = [];
        try {
          const acRes = await tenantPool.query(
            `SELECT v.ac_id as "acId", COALESCE(a.name, v.ac_id::text) as "acName", COUNT(*)::int as "voterCount"
             FROM voters v
             LEFT JOIN assembly_constituencies a ON a.id = v.ac_id
             GROUP BY v.ac_id, a.name
             ORDER BY "voterCount" DESC`
          );
          acBreakdown = acRes.rows.map((r: any) => ({
            acId: String(r.acId),
            acName: r.acName,
            voterCount: parseInt(r.voterCount, 10),
          }));
        } catch {
          // Fallback if assembly_constituencies table is not populated inside tenant DB
        }

        return {
          tenantDbName,
          totalVoters,
          totalBooths,
          totalVolunteers,
          acBreakdown,
        };
      } catch (err: any) {
        logger.error(`[TenantDataService] Failed to fetch stats for DB '${tenantDbName}':`, err);
        throw ApiError.internal(`Failed to access tenant database '${tenantDbName}'`);
      } finally {
        await tenantPool.end();
      }
    });
  }

  /**
   * Retrieves assigned constituencies (PCs and ACs) for the tenant
   */
  async getTenantConstituencies(userId: string): Promise<any> {
    const profile = await this.getTenantProfile(userId);
    const pcIds = profile.assignedPcIds || [];
    const acIds = profile.assignedAcIds || [];

    let pcs: any[] = [];
    let acs: any[] = [];

    if (pcIds.length > 0) {
      const pcsRes = await mainQuery(
        `SELECT p.id, p.name, p.pc_number as "pcNumber", p.state_id as "stateId", s.name as "stateName",
                p.created_at as "createdAt", p.updated_at as "updatedAt"
         FROM parliamentary_constituencies p
         LEFT JOIN states s ON s.id = p.state_id
         WHERE p.id = ANY($1::uuid[])
         ORDER BY p.pc_number ASC`,
        [pcIds]
      );
      pcs = pcsRes.rows;
    }

    if (acIds.length > 0) {
      const acsRes = await mainQuery(
        `SELECT a.id, a.name, a.ac_number as "acNumber", a.pc_id as "pcId", pc.name as "pcName",
                a.district_id as "districtId", d.name as "districtName",
                COALESCE(sp.id, sd.id) as "stateId", COALESCE(sp.name, sd.name) as "stateName",
                a.created_at as "createdAt", a.updated_at as "updatedAt"
         FROM assembly_constituencies a
         LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
         LEFT JOIN states sp ON pc.state_id = sp.id
         LEFT JOIN districts d ON d.id = a.district_id
         LEFT JOIN states sd ON d.state_id = sd.id
         WHERE a.id = ANY($1::uuid[])
         ORDER BY a.ac_number ASC`,
        [acIds]
      );
      acs = acsRes.rows;
    }

    return {
      parliamentaryConstituencies: pcs,
      assemblyConstituencies: acs,
    };
  }

  /**
   * Retrieves polling booths in the tenant's isolated database
   */
  async getTenantBooths(tenantDbName: string | null): Promise<any[]> {
    if (!tenantDbName) {
      throw ApiError.badRequest('No tenant database is assigned to this user account');
    }

    const tenantPool = getTenantDbPool(tenantDbName);

    try {
      const res = await tenantPool.query(
        `SELECT b.id, b.booth_number as "boothNumber", b.name, b.ac_id as "acId", b.ward_id as "wardId",
                COUNT(v.id)::int as "totalVoters"
         FROM booths b
         LEFT JOIN voters v ON v.booth_id = b.id
         GROUP BY b.id, b.booth_number, b.name, b.ac_id, b.ward_id
         ORDER BY b.booth_number ASC`
      );
      return res.rows;
    } catch (err: any) {
      logger.error(`[TenantDataService] Failed to fetch booths for DB '${tenantDbName}':`, err);
      return [];
    } finally {
      await tenantPool.end();
    }
  }
}

export const tenantDataService = new TenantDataService();
