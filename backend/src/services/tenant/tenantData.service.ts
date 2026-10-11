import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../cache.service';
import { query as mainQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../pool/tenantPoolManager';

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
  assignedBoothsCount: number;
  genderBreakdown: { male: number; female: number; other: number };
  partyBreakdown: Array<{ partyId: string | null; partyName: string; count: number; color?: string }>;
  acBreakdown: Array<{ acId: string; acName: string; voterCount: number }>;
  recentVoters: Array<{
    id: string;
    epicNo: string;
    name: string;
    gender: string;
    age: number;
    partyId?: string;
    partyName?: string;
    createdAt: string;
  }>;
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

    return CacheService.getOrSet(`ranniti:tenant:stats:${tenantDbName}`, 300, async () => {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);

      try {
        // 1. Total voters in tenant DB
        const votersCountRes = await tenantPool.query(`SELECT COUNT(*)::int as total FROM voters`);
        const totalVoters = votersCountRes.rows[0]?.total || 0;

        // 2. Total polling booths & assigned booths in tenant DB
        let totalBooths = 0;
        let assignedBoothsCount = 0;
        try {
          const boothsCountRes = await tenantPool.query(`SELECT COUNT(*)::int as total FROM booths`);
          totalBooths = boothsCountRes.rows[0]?.total || 0;
          const assignedRes = await tenantPool.query(`SELECT COUNT(DISTINCT booth_id)::int as total FROM voters WHERE booth_id IS NOT NULL`);
          assignedBoothsCount = assignedRes.rows[0]?.total || 0;
        } catch {
          const distBoothRes = await tenantPool.query(`SELECT COUNT(DISTINCT booth_id)::int as total FROM voters WHERE booth_id IS NOT NULL`);
          totalBooths = distBoothRes.rows[0]?.total || 0;
          assignedBoothsCount = totalBooths;
        }

        // 3. Total active volunteers assigned to this tenant
        let totalVolunteers = 0;
        try {
          const volunteersCountRes = await tenantPool.query(
            `SELECT COUNT(*)::int as total FROM tenant_users WHERE role IN ('pc_leader', 'ac_leader', 'leader', 'sub_leader', 'supporter')`
          );
          totalVolunteers = volunteersCountRes.rows[0]?.total || 0;
        } catch {
          totalVolunteers = 0;
        }

        // 4. Gender breakdown
        const genderBreakdown = { male: 0, female: 0, other: 0 };
        try {
          const genderRes = await tenantPool.query(
            `SELECT LOWER(COALESCE(gender, 'other')) as gender, COUNT(*)::int as count FROM voters GROUP BY LOWER(COALESCE(gender, 'other'))`
          );
          genderRes.rows.forEach((r: any) => {
            const g = r.gender?.trim();
            if (g === 'm' || g === 'male') genderBreakdown.male += parseInt(r.count, 10);
            else if (g === 'f' || g === 'female') genderBreakdown.female += parseInt(r.count, 10);
            else genderBreakdown.other += parseInt(r.count, 10);
          });
        } catch {
          // Fallback if column missing
        }

        // 5. Political party view breakdown
        const partyBreakdown: Array<{ partyId: string | null; partyName: string; count: number; color?: string }> = [];
        try {
          const partyRes = await tenantPool.query(
            `SELECT v.party_id as "partyId", COALESCE(p.name, 'Uncommitted') as "partyName", COALESCE(p.color, '#94A3B8') as "color", COUNT(*)::int as "count"
             FROM voters v
             LEFT JOIN parties p ON p.id = v.party_id
             GROUP BY v.party_id, p.name, p.color
             ORDER BY "count" DESC`
          );
          partyRes.rows.forEach((r: any) => {
            partyBreakdown.push({
              partyId: r.partyId || null,
              partyName: r.partyName || 'Uncommitted',
              count: parseInt(r.count, 10),
              color: r.color,
            });
          });
        } catch {
          // Fallback
        }

        // 6. AC-wise breakdown in tenant DB
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
            acId: String(r.acId || ''),
            acName: r.acName || 'Unassigned AC',
            voterCount: parseInt(r.voterCount, 10),
          }));
        } catch {
          // Fallback if assembly_constituencies table is not populated inside tenant DB
        }

        // 7. Recent voter registrations (Latest 5)
        let recentVoters: Array<{
          id: string;
          epicNo: string;
          name: string;
          gender: string;
          age: number;
          partyId?: string;
          partyName?: string;
          createdAt: string;
        }> = [];
        try {
          const rvRes = await tenantPool.query(
            `SELECT v.id, v.epic_no as "epicNo",
                    TRIM(CONCAT(COALESCE(v.eng_first_name, v.first_name, ''), ' ', COALESCE(v.eng_surname, v.surname, ''))) as name,
                    COALESCE(v.gender, 'M') as gender, COALESCE(v.age, 0) as age,
                    v.party_id as "partyId", p.name as "partyName",
                    v.created_at as "createdAt"
             FROM voters v
             LEFT JOIN parties p ON p.id = v.party_id
             ORDER BY v.created_at DESC
             LIMIT 5`
          );
          recentVoters = rvRes.rows.map((r: any) => ({
            id: String(r.id),
            epicNo: r.epicNo || '',
            name: r.name?.trim() || 'Voter Record',
            gender: r.gender || 'M',
            age: parseInt(r.age, 10) || 0,
            partyId: r.partyId || undefined,
            partyName: r.partyName || undefined,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          }));
        } catch {
          // Fallback
        }

        return {
          tenantDbName,
          totalVoters,
          totalBooths,
          totalVolunteers,
          assignedBoothsCount,
          genderBreakdown,
          partyBreakdown,
          acBreakdown,
          recentVoters,
        };
      } catch (err: any) {
        logger.error(`[TenantDataService] Failed to fetch stats for DB '${tenantDbName}':`, err);
        throw ApiError.internal(`Failed to access tenant database '${tenantDbName}'`);
      }
    });
  }

  /**
   * Retrieves assigned constituencies (PCs and ACs) for the tenant
   */
  async getTenantConstituencies(userId: string, tenantDbName?: string | null): Promise<any> {
    const profile = await this.getTenantProfile(userId);
    const targetDbName = tenantDbName || profile.tenantDbName;
    const pcIds = profile.assignedPcIds || [];
    const acIds = profile.assignedAcIds || [];

    let pcs: any[] = [];
    let acs: any[] = [];

    const executeQuery = async (sql: string, params: any[]) => {
      if (targetDbName) {
        return TenantPoolManager.query(targetDbName, sql, params);
      }
      return mainQuery(sql, params);
    };

    if (pcIds.length > 0) {
      const pcsRes = await executeQuery(
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
      const acsRes = await executeQuery(
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

    const tenantPool = TenantPoolManager.getPool(tenantDbName);

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
    }
  }
}

export const tenantDataService = new TenantDataService();
