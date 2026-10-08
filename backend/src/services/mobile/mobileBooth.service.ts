import { logger } from '../../utils/logger';
import { UserRecord } from '../../queries/auth.queries';
import { query as masterQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../../utils/tenantPoolManager';


export interface MobileBoothItem {
  id: string;
  boothNumber: number;
  name: string;
  locationBuilding: string | null;
  totalVoters: number;
  votedCount: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  acId: string | null;
  acName: string | null;
  wardId: string | null;
  wardName: string | null;
  wardNumber: number | null;
}

export interface MobileBoothListResult {
  booths: MobileBoothItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class MobileBoothService {
  async getAssignedBooths(
    user: Omit<UserRecord, 'passwordHash'>,
    options: {
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<MobileBoothListResult> {
    const pageNum = Math.max(1, Number(options.page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(options.limit) || 25));
    const offsetNum = (pageNum - 1) * limitNum;
    const search = options.search?.trim();

    const executeTenantQuery = async (sqlStr: string, sqlParams: any[] = []) => {
      if (user.tenantDbName && user.tenantDbName.trim()) {
        return await TenantPoolManager.query(user.tenantDbName.trim(), sqlStr, sqlParams);
      }
      return await masterQuery(sqlStr, sqlParams);
    };

    // Use preloaded assignedBoothIds if present; fallback to DB query only if undefined
    let assignedBoothIds = user.assignedBoothIds;
    if (assignedBoothIds === undefined) {
      try {
        const ubaRes = await executeTenantQuery(
          `SELECT booth_id FROM user_booth_assignments WHERE user_id = $1`,
          [user.id]
        );
        assignedBoothIds = ubaRes.rows.map((r: { booth_id: string }) => r.booth_id);
      } catch (err) {
        logger.warn('[MobileBoothService] Error fetching user_booth_assignments:', err);
        assignedBoothIds = [];
      }
    }

    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    // Role-based scoping
    if (assignedBoothIds && assignedBoothIds.length > 0) {
      params.push(assignedBoothIds);
      conditions.push(`b.id = ANY($${params.length})`);
    } else if (user.role === 'pc_leader' && user.assignedPcId) {
      params.push(user.assignedPcId);
      conditions.push(`a.pc_id = $${params.length}`);
    } else if (user.role === 'ac_leader' && user.assignedAcId) {
      params.push(user.assignedAcId);
      conditions.push(`b.ac_id = $${params.length}`);
    } else if (user.assignedAcId) {
      params.push(user.assignedAcId);
      conditions.push(`b.ac_id = $${params.length}`);
    } else if (user.assignedPcId) {
      params.push(user.assignedPcId);
      conditions.push(`a.pc_id = $${params.length}`);
    } else if (user.role !== 'super_admin' && user.role !== 'tenant_admin') {
      // If role is constrained but has no scope assigned, return empty
      return {
        booths: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      };
    }

    // Search filter across booth name, number, building location, or ward
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(
        b.name ILIKE $${params.length}
        OR b.location_building ILIKE $${params.length}
        OR CAST(b.booth_number AS TEXT) ILIKE $${params.length}
        OR w.name ILIKE $${params.length}
      )`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total Count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM booths b
      LEFT JOIN assembly_constituencies a ON b.ac_id = a.id
      LEFT JOIN wards w ON b.ward_id = w.id
      ${whereClause}
    `;

    const countRes = await executeTenantQuery(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);
    const totalPages = Math.ceil(total / limitNum);

    // List Query with voter metrics & gender breakdown
    const listParams = [...params];
    listParams.push(limitNum);
    const limitPlaceholder = `$${listParams.length}`;
    listParams.push(offsetNum);
    const offsetPlaceholder = `$${listParams.length}`;

    const listSql = `
      SELECT
        b.id,
        b.booth_number AS "boothNumber",
        b.name,
        b.location_building AS "locationBuilding",
        COALESCE(
          NULLIF(b.total_voters, 0),
          (SELECT COUNT(*)::int FROM voters v WHERE v.booth_id = b.id)
        )::int AS "totalVoters",
        COALESCE(
          (SELECT COUNT(*)::int FROM voters v WHERE v.booth_id = b.id AND (v.status = 'VOTED' OR v.status = 'voted')),
          0
        )::int AS "votedCount",
        COALESCE(
          (SELECT COUNT(*)::int FROM voters v WHERE v.booth_id = b.id AND LOWER(v.gender) IN ('male', 'm')),
          0
        )::int AS "maleCount",
        COALESCE(
          (SELECT COUNT(*)::int FROM voters v WHERE v.booth_id = b.id AND LOWER(v.gender) IN ('female', 'f')),
          0
        )::int AS "femaleCount",
        COALESCE(
          (SELECT COUNT(*)::int FROM voters v WHERE v.booth_id = b.id AND LOWER(v.gender) NOT IN ('male', 'm', 'female', 'f') AND v.gender IS NOT NULL),
          0
        )::int AS "otherCount",
        b.ac_id AS "acId",
        a.name AS "acName",
        b.ward_id AS "wardId",
        w.name AS "wardName",
        w.ward_number AS "wardNumber"
      FROM booths b
      LEFT JOIN assembly_constituencies a ON b.ac_id = a.id
      LEFT JOIN wards w ON b.ward_id = w.id
      ${whereClause}
      ORDER BY b.booth_number ASC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `;

    const listRes = await executeTenantQuery(listSql, listParams);

    const booths: MobileBoothItem[] = listRes.rows.map((row: any) => ({
      id: row.id,
      boothNumber: Number(row.boothNumber),
      name: row.name || `Booth #${row.boothNumber}`,
      locationBuilding: row.locationBuilding || null,
      totalVoters: Number(row.totalVoters || 0),
      votedCount: Number(row.votedCount || 0),
      maleCount: Number(row.maleCount || 0),
      femaleCount: Number(row.femaleCount || 0),
      otherCount: Number(row.otherCount || 0),
      acId: row.acId || null,
      acName: row.acName || null,
      wardId: row.wardId || null,
      wardName: row.wardName || null,
      wardNumber: row.wardNumber !== null && row.wardNumber !== undefined ? Number(row.wardNumber) : null,
    }));

    return {
      booths,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }
}

export const mobileBoothService = new MobileBoothService();
