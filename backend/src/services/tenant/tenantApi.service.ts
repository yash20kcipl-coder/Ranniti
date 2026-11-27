import { TenantAcService } from './ac.service';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';
import { CacheService } from '../cache.service';
import { TenantWardService } from './ward.service';
import { TenantBoothService } from './booth.service';
import { query as mainQuery } from '../../queries/dbPool';
import { TenantPoolManager } from '../pool/tenantPoolManager';
import { MasterAutoSyncService } from '../sync/masterAutoSync.service';

async function executeTenantQuery(sqlStr: string, queryValues: any[] = [], tenantDbName?: string | null) {
  if (tenantDbName && tenantDbName.trim()) {
    return await TenantPoolManager.query(tenantDbName.trim(), sqlStr, queryValues);
  }
  return await mainQuery(sqlStr, queryValues);
}

export interface CreateAcInput {
  pcId: string;
  districtId?: string;
  acNumber: number;
  name: string;
}

export interface CreateWardInput {
  acId: string;
  wardNumber: number;
  name: string;
}

export interface CreateBoothInput {
  acId: string;
  wardId?: string;
  villageId?: string;
  boothNumber: number;
  name: string;
  locationBuilding?: string;
}

export interface CreateTalukaInput {
  districtId: string;
  name: string;
}

export interface CreateVillageInput {
  talukaId: string;
  name: string;
}

export interface CreateCasteInput {
  name: string;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'Other';
  religionId?: string;
  parentCasteId?: string;
}

export interface CreatePartyInput {
  name: string;
  abbreviation: string;
  symbolLogo?: string;
  alliance?: string;
  color?: string;
}

export interface CreateProfessionCategoryInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateProfessionInput {
  categoryId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export class TenantApiService {
  /**
   * Helper: Get tenant user profile & assigned AC IDs
   */
  private async getAssignedAcIds(userId: string): Promise<string[]> {
    const tenantRes = await mainQuery(
      `SELECT ac_ids FROM tenants WHERE id = $1`,
      [userId]
    );
    return tenantRes.rows[0]?.ac_ids || [];
  }

  // --- ASSEMBLY CONSTITUENCIES (ACs) ---
  async getTenantAcs(
    userId: string,
    params?: { pcId?: string; districtId?: string; stateId?: string; search?: string; page?: number; limit?: number },
    tenantDbName?: string | null
  ) {
    const isFiltered = !!params?.search;
    const cacheKey = !isFiltered ? `ranniti:tenant:${tenantDbName || 'master'}:acs:${JSON.stringify(params || {})}` : null;

    const fetchAcs = async () => {
      const acIds = tenantDbName ? [] : await this.getAssignedAcIds(userId);
      let baseFrom = `
        FROM assembly_constituencies a
        LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
        LEFT JOIN states sp ON pc.state_id = sp.id
        LEFT JOIN districts d ON d.id = a.district_id
        LEFT JOIN states sd ON d.state_id = sd.id
      `;
      const sqlParams: any[] = [];
      const conditions: string[] = [];

      if (acIds.length > 0) {
        sqlParams.push(acIds);
        conditions.push(`a.id = ANY($${sqlParams.length}::uuid[])`);
      }

      if (params?.pcId) {
        sqlParams.push(params.pcId);
        conditions.push(`a.pc_id = $${sqlParams.length}`);
      }

      if (params?.districtId) {
        sqlParams.push(params.districtId);
        conditions.push(`a.district_id = $${sqlParams.length}`);
      }

      if (params?.stateId) {
        sqlParams.push(params.stateId);
        conditions.push(`(sp.id = $${sqlParams.length} OR sd.id = $${sqlParams.length})`);
      }

      if (params?.search && params.search.trim()) {
        sqlParams.push(`%${params.search.trim()}%`);
        const p = `$${sqlParams.length}`;
        conditions.push(`(a.name ILIKE ${p} OR pc.name ILIKE ${p} OR d.name ILIKE ${p} OR CAST(a.ac_number AS TEXT) ILIKE ${p})`);
      }

      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

      if (params?.page || params?.limit) {
        const page = Math.max(1, params?.page || 1);
        const limit = Math.max(1, Math.min(500, params?.limit || 25));
        const offset = (page - 1) * limit;

        const countRes = await executeTenantQuery(`SELECT COUNT(*) as total ${baseFrom}${whereClause}`, sqlParams, tenantDbName);
        const total = parseInt(countRes.rows[0]?.total || '0', 10);
        const totalPages = Math.ceil(total / limit);

        const queryStr = `
          SELECT 
            a.id, 
            a.pc_id AS "pcId", 
            pc.name AS "pcName",
            a.district_id AS "districtId", 
            d.name AS "districtName",
            COALESCE(sp.id, sd.id) AS "stateId",
            COALESCE(sp.name, sd.name) AS "stateName",
            a.ac_number AS "acNumber", 
            a.name, 
            a.created_at AS "createdAt", 
            a.updated_at AS "updatedAt"
          ${baseFrom}${whereClause}
          ORDER BY a.ac_number ASC
          LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}
        `;
        const dataRes = await executeTenantQuery(queryStr, [...sqlParams, limit, offset], tenantDbName);
        return { acs: dataRes.rows, pagination: { total, page, limit, totalPages } };
      }

      const queryStr = `
        SELECT 
          a.id, 
          a.pc_id AS "pcId", 
          pc.name AS "pcName",
          a.district_id AS "districtId", 
          d.name AS "districtName",
          COALESCE(sp.id, sd.id) AS "stateId",
          COALESCE(sp.name, sd.name) AS "stateName",
          a.ac_number AS "acNumber", 
          a.name, 
          a.created_at AS "createdAt", 
          a.updated_at AS "updatedAt"
        ${baseFrom}${whereClause}
        ORDER BY a.ac_number ASC
      `;
      const res = await executeTenantQuery(queryStr, sqlParams, tenantDbName);
      return res.rows;
    };

    if (cacheKey) {
      return await CacheService.getOrSet(cacheKey, 3600, fetchAcs);
    }
    return await fetchAcs();
  }

  async createTenantAc(userId: string, input: CreateAcInput, tenantDbName?: string | null) {
    const { pcId, districtId, acNumber, name } = input;
    if (!pcId || !acNumber || !name) {
      throw ApiError.badRequest('pcId, acNumber, and name are required');
    }

    let newAc;
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      newAc = await TenantAcService.createTenantAc(tenantPool, {
        acNo: acNumber,
        acName: name,
        districtId,
        pcId,
      });
    } else {
      const insertRes = await executeTenantQuery(
        `INSERT INTO assembly_constituencies (pc_id, district_id, ac_number, name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, pc_id AS "pcId", district_id AS "districtId", ac_number AS "acNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [pcId, districtId || null, acNumber, name],
        tenantDbName
      );
      newAc = insertRes.rows[0];
    }

    // Link newly created AC to tenants.ac_ids for this tenant in Master DB
    await mainQuery(
      `UPDATE tenants
       SET ac_ids = array_append(COALESCE(ac_ids, '{}'), $1::uuid), updated_at = NOW()
       WHERE id = $2 AND NOT ($1::uuid = ANY(COALESCE(ac_ids, '{}')))`,
      [newAc.id, userId]
    );

    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:acs*`);
    return newAc;
  }

  async updateTenantAc(id: string, input: Partial<CreateAcInput>, tenantDbName?: string | null) {
    const { pcId, districtId, acNumber, name } = input;
    const res = await executeTenantQuery(
      `UPDATE assembly_constituencies
       SET pc_id = COALESCE($1, pc_id),
           district_id = COALESCE($2, district_id),
           ac_number = COALESCE($3, ac_number),
           name = COALESCE($4, name),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, pc_id AS "pcId", district_id AS "districtId", ac_number AS "acNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [pcId || null, districtId || null, acNumber || null, name || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Assembly constituency not found');
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      MasterAutoSyncService.syncEntityToMaster(tenantPool, 'ac', id, 'UPDATE', res.rows[0]).catch(() => { });
    }
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:acs*`);
    return res.rows[0];
  }

  async deleteTenantAc(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM assembly_constituencies WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Assembly constituency not found');
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      MasterAutoSyncService.syncEntityToMaster(tenantPool, 'ac', id, 'DELETE', { id }).catch(() => { });
    }
  }

  // --- WARDS ---
  async getTenantWards(
    userId: string,
    params?: { acId?: string; pcId?: string; districtId?: string; stateId?: string; search?: string; page?: number; limit?: number },
    tenantDbName?: string | null
  ) {
    const isFiltered = !!params?.search;
    const cacheKey = !isFiltered ? `ranniti:tenant:${tenantDbName || 'master'}:wards:${JSON.stringify(params || {})}` : null;

    const fetchWards = async () => {
      const acIds = tenantDbName ? [] : await this.getAssignedAcIds(userId);
      let baseFrom = `
        FROM wards w
        LEFT JOIN assembly_constituencies a ON a.id = w.ac_id
        LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
        LEFT JOIN states sp ON pc.state_id = sp.id
        LEFT JOIN districts d ON d.id = a.district_id
        LEFT JOIN states sd ON d.state_id = sd.id
      `;
      const sqlParams: any[] = [];
      const conditions: string[] = [];

      if (params?.acId) {
        sqlParams.push(params.acId);
        conditions.push(`w.ac_id = $${sqlParams.length}`);
      } else if (acIds.length > 0) {
        sqlParams.push(acIds);
        conditions.push(`w.ac_id = ANY($${sqlParams.length}::uuid[])`);
      }

      if (params?.pcId) {
        sqlParams.push(params.pcId);
        conditions.push(`a.pc_id = $${sqlParams.length}`);
      }

      if (params?.districtId) {
        sqlParams.push(params.districtId);
        conditions.push(`a.district_id = $${sqlParams.length}`);
      }

      if (params?.stateId) {
        sqlParams.push(params.stateId);
        conditions.push(`(sp.id = $${sqlParams.length} OR sd.id = $${sqlParams.length})`);
      }

      if (params?.search && params.search.trim()) {
        sqlParams.push(`%${params.search.trim()}%`);
        const p = `$${sqlParams.length}`;
        conditions.push(`(w.name ILIKE ${p} OR a.name ILIKE ${p} OR CAST(w.ward_number AS TEXT) ILIKE ${p})`);
      }

      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

      if (params?.page || params?.limit) {
        const page = Math.max(1, params?.page || 1);
        const limit = Math.max(1, Math.min(500, params?.limit || 25));
        const offset = (page - 1) * limit;

        const countRes = await executeTenantQuery(`SELECT COUNT(*) as total ${baseFrom}${whereClause}`, sqlParams, tenantDbName);
        const total = parseInt(countRes.rows[0]?.total || '0', 10);
        const totalPages = Math.ceil(total / limit);

        const queryStr = `
          SELECT 
            w.id, 
            w.ac_id AS "acId", 
            a.name AS "acName",
            a.ac_number AS "acNumber",
            a.pc_id AS "pcId",
            pc.name AS "pcName",
            a.district_id AS "districtId",
            d.name AS "districtName",
            COALESCE(sp.id, sd.id) AS "stateId",
            COALESCE(sp.name, sd.name) AS "stateName",
            w.ward_number AS "wardNumber",
            w.name,
            w.created_at AS "createdAt",
            w.updated_at AS "updatedAt"
          ${baseFrom}${whereClause}
          ORDER BY w.ward_number ASC, w.name ASC
          LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}
        `;
        const dataRes = await executeTenantQuery(queryStr, [...sqlParams, limit, offset], tenantDbName);
        return { wards: dataRes.rows, pagination: { total, page, limit, totalPages } };
      }

      const queryStr = `
        SELECT 
          w.id, 
          w.ac_id AS "acId", 
          a.name AS "acName",
          a.ac_number AS "acNumber",
          a.pc_id AS "pcId",
          pc.name AS "pcName",
          a.district_id AS "districtId",
          d.name AS "districtName",
          COALESCE(sp.id, sd.id) AS "stateId",
          COALESCE(sp.name, sd.name) AS "stateName",
          w.ward_number AS "wardNumber",
          w.name,
          w.created_at AS "createdAt",
          w.updated_at AS "updatedAt"
        ${baseFrom}${whereClause}
        ORDER BY w.ward_number ASC, w.name ASC
      `;
      const res = await executeTenantQuery(queryStr, sqlParams, tenantDbName);
      return res.rows;
    };

    if (cacheKey) {
      return await CacheService.getOrSet(cacheKey, 3600, fetchWards);
    }
    return await fetchWards();
  }

  async createTenantWard(input: CreateWardInput, tenantDbName?: string | null) {
    const { acId, wardNumber, name } = input;
    if (!acId || !wardNumber || !name) {
      throw ApiError.badRequest('acId, wardNumber, and name are required');
    }

    let newWard;
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      newWard = await TenantWardService.createTenantWard(tenantPool, {
        acId,
        wardNo: wardNumber,
        wardName: name,
      });
    } else {
      const res = await executeTenantQuery(
        `INSERT INTO wards (ac_id, ward_number, name)
         VALUES ($1, $2, $3)
         RETURNING id, ac_id AS "acId", ward_number AS "wardNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [acId, wardNumber, name],
        tenantDbName
      );
      newWard = res.rows[0];
    }
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:wards*`);
    return newWard;
  }

  async updateTenantWard(id: string, input: Partial<CreateWardInput>, tenantDbName?: string | null) {
    const { acId, wardNumber, name } = input;
    const res = await executeTenantQuery(
      `UPDATE wards
       SET ac_id = COALESCE($1, ac_id),
           ward_number = COALESCE($2, ward_number),
           name = COALESCE($3, name),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, ac_id AS "acId", ward_number AS "wardNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [acId || null, wardNumber || null, name || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Ward not found');
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      MasterAutoSyncService.syncEntityToMaster(tenantPool, 'ward', id, 'UPDATE', res.rows[0]).catch(() => { });
    }
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:wards*`);
    return res.rows[0];
  }

  async deleteTenantWard(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM wards WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Ward not found');
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      MasterAutoSyncService.syncEntityToMaster(tenantPool, 'ward', id, 'DELETE', { id }).catch(() => { });
    }
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:wards*`);
  }

  // --- BOOTHS ---
  async getTenantBoothOptions(
    userId: string,
    params?: { acId?: string; wardId?: string; search?: string; limit?: number },
    tenantDbName?: string | null
  ) {
    const isFiltered = !!params?.search;
    const cacheKey = !isFiltered ? `ranniti:tenant:${tenantDbName || 'master'}:user:${userId}:booth_options_v5:${JSON.stringify(params || {})}` : null;

    const fetchBoothOptions = async () => {
      const sqlParams: any[] = [];
      const conditions: string[] = [];

      let assignedBoothIds: string[] = [];
      try {
        const userBoothsRes = await executeTenantQuery(
          `SELECT booth_id FROM user_booth_assignments WHERE user_id = $1`,
          [userId],
          tenantDbName
        );
        if (userBoothsRes.rows.length > 0) {
          assignedBoothIds = userBoothsRes.rows.map(r => r.booth_id);
        }
      } catch {
        // In case table or connection falls back
      }

      if (assignedBoothIds.length > 0) {
        sqlParams.push(assignedBoothIds);
        conditions.push(`b.id = ANY($${sqlParams.length}::uuid[])`);
        if (params?.acId) {
          sqlParams.push(params.acId);
          conditions.push(`b.ac_id = $${sqlParams.length}`);
        }
      } else if (params?.acId) {
        sqlParams.push(params.acId);
        conditions.push(`b.ac_id = $${sqlParams.length}`);
      } else {
        const acIds = await this.getAssignedAcIds(userId);
        if (acIds.length > 0) {
          sqlParams.push(acIds);
          conditions.push(`b.ac_id = ANY($${sqlParams.length}::uuid[])`);
        } else {
          conditions.push('1=1');
        }
      }

      if (params?.wardId) {
        sqlParams.push(params.wardId);
        conditions.push(`b.ward_id = $${sqlParams.length}`);
      }

      if (params?.search && params.search.trim()) {
        sqlParams.push(`%${params.search.trim()}%`);
        const p = `$${sqlParams.length}`;
        conditions.push(`(b.name ILIKE ${p} OR CAST(b.booth_number AS TEXT) ILIKE ${p} OR a.name ILIKE ${p} OR pc.name ILIKE ${p})`);
      }

      if (conditions.length === 0) {
        return [];
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      const maxLimit = Math.min(Math.max(1, params?.limit || 500), 1000);
      sqlParams.push(maxLimit);

      const sql = `
        SELECT 
          b.id, 
          b.booth_number AS "boothNumber", 
          b.name, 
          b.ac_id AS "acId",
          a.name AS "acName",
          pc.name AS "pcName",
          b.ward_id AS "wardId",
          w.name AS "wardName"
        FROM booths b
        LEFT JOIN assembly_constituencies a ON a.id = b.ac_id
        LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
        LEFT JOIN wards w ON w.id = b.ward_id
        ${whereClause}
        ORDER BY b.booth_number ASC
        LIMIT $${sqlParams.length}
      `;

      const res = await executeTenantQuery(sql, sqlParams, tenantDbName);
      return res.rows;
    };

    if (cacheKey) {
      return await CacheService.getOrSet(cacheKey, 3600, fetchBoothOptions);
    }
    return await fetchBoothOptions();
  }

  async getTenantBooths(
    userId: string,
    params?: { acId?: string; wardId?: string; pcId?: string; districtId?: string; stateId?: string; search?: string; page?: number; limit?: number },
    tenantDbName?: string | null
  ) {
    const isFiltered = !!params?.search;
    const cacheKey = !isFiltered ? `ranniti:tenant:${tenantDbName || 'master'}:booths:${JSON.stringify(params || {})}` : null;

    const fetchBooths = async () => {
      let baseFrom = `
        FROM booths b
        LEFT JOIN assembly_constituencies a ON a.id = b.ac_id
        LEFT JOIN wards w ON w.id = b.ward_id
        LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
        LEFT JOIN states sp ON pc.state_id = sp.id
        LEFT JOIN districts d ON d.id = a.district_id
        LEFT JOIN states sd ON d.state_id = sd.id
      `;
      const sqlParams: any[] = [];
      const conditions: string[] = [];

      if (!tenantDbName) {
        const userBoothsRes = await mainQuery(
          `SELECT booth_id FROM user_booth_assignments WHERE user_id = $1`,
          [userId]
        );

        if (userBoothsRes.rows.length > 0) {
          const assignedBoothIds = userBoothsRes.rows.map(r => r.booth_id);
          sqlParams.push(assignedBoothIds);
          conditions.push(`b.id = ANY($${sqlParams.length}::uuid[])`);
        } else {
          const acIds = await this.getAssignedAcIds(userId);
          if (params?.acId) {
            sqlParams.push(params.acId);
            conditions.push(`b.ac_id = $${sqlParams.length}`);
          } else if (acIds.length > 0) {
            sqlParams.push(acIds);
            conditions.push(`b.ac_id = ANY($${sqlParams.length}::uuid[])`);
          }
        }

        if (params?.acId && userBoothsRes.rows.length > 0) {
          sqlParams.push(params.acId);
          conditions.push(`b.ac_id = $${sqlParams.length}`);
        }
      } else if (params?.acId) {
        sqlParams.push(params.acId);
        conditions.push(`b.ac_id = $${sqlParams.length}`);
      }

      if (params?.wardId) {
        sqlParams.push(params.wardId);
        conditions.push(`b.ward_id = $${sqlParams.length}`);
      }

      if (params?.pcId) {
        sqlParams.push(params.pcId);
        conditions.push(`a.pc_id = $${sqlParams.length}`);
      }

      if (params?.districtId) {
        sqlParams.push(params.districtId);
        conditions.push(`a.district_id = $${sqlParams.length}`);
      }

      if (params?.stateId) {
        sqlParams.push(params.stateId);
        conditions.push(`(sp.id = $${sqlParams.length} OR sd.id = $${sqlParams.length})`);
      }

      if (params?.search && params.search.trim()) {
        sqlParams.push(`%${params.search.trim()}%`);
        const p = `$${sqlParams.length}`;
        conditions.push(`(b.name ILIKE ${p} OR a.name ILIKE ${p} OR w.name ILIKE ${p} OR CAST(b.booth_number AS TEXT) ILIKE ${p} OR b.location_building ILIKE ${p})`);
      }

      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

      if (params?.page || params?.limit) {
        const page = Math.max(1, params?.page || 1);
        const limit = Math.max(1, Math.min(500, params?.limit || 25));
        const offset = (page - 1) * limit;

        const countRes = await executeTenantQuery(`SELECT COUNT(*) as total ${baseFrom}${whereClause}`, sqlParams, tenantDbName);
        const total = parseInt(countRes.rows[0]?.total || '0', 10);
        const totalPages = Math.ceil(total / limit);

        const queryStr = `
          SELECT 
            b.id, 
            b.ac_id AS "acId", 
            a.name AS "acName",
            a.ac_number AS "acNumber",
            a.pc_id AS "pcId",
            pc.name AS "pcName",
            a.district_id AS "districtId",
            d.name AS "districtName",
            COALESCE(sp.id, sd.id) AS "stateId",
            COALESCE(sp.name, sd.name) AS "stateName",
            b.ward_id AS "wardId",
            w.name AS "wardName",
            w.ward_number AS "wardNumber",
            b.village_id AS "villageId",
            b.booth_number AS "boothNumber", 
            b.name, 
            b.location_building AS "locationBuilding", 
            b.total_voters AS "totalVoters", 
            b.created_at AS "createdAt", 
            b.updated_at AS "updatedAt"
          ${baseFrom}${whereClause}
          ORDER BY b.booth_number ASC
          LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}
        `;
        const dataRes = await executeTenantQuery(queryStr, [...sqlParams, limit, offset], tenantDbName);
        return { booths: dataRes.rows, pagination: { total, page, limit, totalPages } };
      }

      const queryStr = `
        SELECT 
          b.id, 
          b.ac_id AS "acId", 
          a.name AS "acName",
          a.ac_number AS "acNumber",
          a.pc_id AS "pcId",
          pc.name AS "pcName",
          a.district_id AS "districtId",
          d.name AS "districtName",
          COALESCE(sp.id, sd.id) AS "stateId",
          COALESCE(sp.name, sd.name) AS "stateName",
          b.ward_id AS "wardId",
          w.name AS "wardName",
          w.ward_number AS "wardNumber",
          b.village_id AS "villageId",
          b.booth_number AS "boothNumber", 
          b.name, 
          b.location_building AS "locationBuilding", 
          b.total_voters AS "totalVoters", 
          b.created_at AS "createdAt", 
          b.updated_at AS "updatedAt"
        ${baseFrom}${whereClause}
        ORDER BY b.booth_number ASC
      `;
      const res = await executeTenantQuery(queryStr, sqlParams, tenantDbName);
      return res.rows;
    };

    if (cacheKey) {
      return await CacheService.getOrSet(cacheKey, 3600, fetchBooths);
    }
    return await fetchBooths();
  }

  async createTenantBooth(userId: string, input: CreateBoothInput, tenantDbName?: string | null) {
    const { acId, wardId, villageId, boothNumber, name, locationBuilding } = input;
    if (!acId || !boothNumber || !name) {
      throw ApiError.badRequest('acId, boothNumber, and name are required');
    }

    let newBooth;
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      newBooth = await TenantBoothService.createTenantBooth(tenantPool, {
        acId,
        wardId: wardId || undefined,
        boothNo: boothNumber,
        boothName: name,
      });
    } else {
      const insertRes = await executeTenantQuery(
        `INSERT INTO booths (ac_id, ward_id, village_id, booth_number, name, location_building)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, ac_id AS "acId", ward_id AS "wardId", village_id AS "villageId", booth_number AS "boothNumber", name, location_building AS "locationBuilding", total_voters AS "totalVoters", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [acId, wardId || null, villageId || null, boothNumber, name, locationBuilding || null],
        tenantDbName
      );
      newBooth = insertRes.rows[0];
    }

    // Assign new booth to current tenant user in Tenant DB
    await executeTenantQuery(
      `INSERT INTO user_booth_assignments (user_id, booth_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, booth_id) DO NOTHING`,
      [userId, newBooth.id],
      tenantDbName
    );

    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:booth*`);
    return newBooth;
  }

  async updateTenantBooth(id: string, input: Partial<CreateBoothInput> & { totalVoters?: number }, tenantDbName?: string | null) {
    const { acId, wardId, villageId, boothNumber, name, locationBuilding, totalVoters } = input;
    const res = await executeTenantQuery(
      `UPDATE booths
       SET ac_id = COALESCE($1, ac_id),
           ward_id = COALESCE($2, ward_id),
           village_id = COALESCE($3, village_id),
           booth_number = COALESCE($4, booth_number),
           name = COALESCE($5, name),
           location_building = COALESCE($6, location_building),
           total_voters = COALESCE($7, total_voters),
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, ac_id AS "acId", ward_id AS "wardId", village_id AS "villageId",
                 booth_number AS "boothNumber", name, location_building AS "locationBuilding",
                 total_voters AS "totalVoters", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [acId || null, wardId || null, villageId || null, boothNumber || null, name || null, locationBuilding || null, totalVoters || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Booth not found');
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      MasterAutoSyncService.syncEntityToMaster(tenantPool, 'booth', id, 'UPDATE', res.rows[0]).catch(() => { });
    }
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:booth*`);
    return res.rows[0];
  }

  async deleteTenantBooth(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM booths WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Booth not found');
    if (tenantDbName) {
      const tenantPool = TenantPoolManager.getPool(tenantDbName);
      MasterAutoSyncService.syncEntityToMaster(tenantPool, 'booth', id, 'DELETE', { id }).catch(() => { });
    }
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:booth*`);
  }

  // --- GEOGRAPHY REFERENCE ---
  async getTenantStates(tenantDbName?: string | null) {
    const cacheKey = `ranniti:tenant:${tenantDbName || 'master'}:states`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      const res = await executeTenantQuery(
        `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" 
         FROM states 
         ORDER BY name ASC`,
        [],
        tenantDbName
      );
      return res.rows;
    });
  }

  async getTenantPcs(stateId?: string, tenantDbName?: string | null, userId?: string) {
    let resolvedDb = tenantDbName;
    let assignedPcIds: string[] = [];

    if (!resolvedDb && userId) {
      const tRes = await mainQuery(
        `SELECT tenant_db_name, pc_ids, ac_ids FROM tenants WHERE id = $1 LIMIT 1`,
        [userId]
      );
      if (tRes.rows[0]) {
        resolvedDb = tRes.rows[0].tenant_db_name || null;
        const pcList: string[] = tRes.rows[0].pc_ids || [];
        const acList: string[] = tRes.rows[0].ac_ids || [];
        const pcSet = new Set<string>(pcList);
        if (acList.length > 0) {
          const parentPcRes = await mainQuery(
            `SELECT DISTINCT pc_id FROM assembly_constituencies WHERE id = ANY($1::uuid[]) AND pc_id IS NOT NULL`,
            [acList]
          );
          for (const r of parentPcRes.rows) {
            if (r.pc_id) pcSet.add(r.pc_id);
          }
        }
        assignedPcIds = Array.from(pcSet);
      }
    }

    const cacheKey = `ranniti:tenant:${resolvedDb || userId || 'master'}:pcs:${stateId || 'all'}`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      let queryStr = `
        SELECT 
          p.id, 
          p.state_id AS "stateId", 
          s.name AS "stateName",
          p.pc_number AS "pcNumber", 
          p.name, 
          p.created_at AS "createdAt", 
          p.updated_at AS "updatedAt" 
        FROM parliamentary_constituencies p
        LEFT JOIN states s ON p.state_id = s.id
      `;
      const sqlParams: any[] = [];
      const whereClauses: string[] = [];

      if (stateId) {
        sqlParams.push(stateId);
        whereClauses.push(`p.state_id = $${sqlParams.length}`);
      }

      if (!resolvedDb && assignedPcIds.length > 0) {
        sqlParams.push(assignedPcIds);
        whereClauses.push(`p.id = ANY($${sqlParams.length}::uuid[])`);
      }

      if (whereClauses.length > 0) {
        queryStr += ` WHERE ` + whereClauses.join(' AND ');
      }

      queryStr += ` ORDER BY p.pc_number ASC`;

      const res = await executeTenantQuery(queryStr, sqlParams, resolvedDb);
      return res.rows;
    });
  }

  async getTenantDistricts(stateId?: string, tenantDbName?: string | null) {
    const cacheKey = `ranniti:tenant:${tenantDbName || 'master'}:districts:${stateId || 'all'}`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      if (stateId) {
        const res = await executeTenantQuery(
          `SELECT 
             d.id, 
             d.state_id AS "stateId", 
             s.name AS "stateName",
             d.name, 
             d.created_at AS "createdAt", 
             d.updated_at AS "updatedAt" 
           FROM districts d
           INNER JOIN states s ON d.state_id = s.id
           WHERE d.state_id = $1 
           ORDER BY s.name ASC, d.name ASC`,
          [stateId],
          tenantDbName
        );
        return res.rows;
      }
      const res = await executeTenantQuery(
        `SELECT 
           d.id, 
           d.state_id AS "stateId", 
           s.name AS "stateName",
           d.name, 
           d.created_at AS "createdAt", 
           d.updated_at AS "updatedAt" 
         FROM districts d
         INNER JOIN states s ON d.state_id = s.id
         ORDER BY s.name ASC, d.name ASC`,
        [],
        tenantDbName
      );
      return res.rows;
    });
  }

  async getTenantTalukas(
    paramsOrDistrictId?: string | { districtId?: string; stateId?: string; search?: string; limit?: number },
    tenantDbName?: string | null
  ) {
    let districtId: string | undefined;
    let stateId: string | undefined;
    let search: string | undefined;
    let limit: number | undefined;

    if (typeof paramsOrDistrictId === 'object' && paramsOrDistrictId !== null) {
      districtId = paramsOrDistrictId.districtId;
      stateId = paramsOrDistrictId.stateId;
      search = paramsOrDistrictId.search;
      limit = paramsOrDistrictId.limit;
    } else {
      districtId = paramsOrDistrictId;
    }

    const isFiltered = Boolean(search?.trim());
    const cacheKey = !isFiltered
      ? `ranniti:tenant:${tenantDbName || 'master'}:talukas:${districtId || 'all'}:${stateId || 'all'}:${limit || 'all'}`
      : null;

    const fetchTalukas = async () => {
      const sqlParams: any[] = [];
      const conditions: string[] = [];

      if (districtId) {
        sqlParams.push(districtId);
        conditions.push(`t.district_id = $${sqlParams.length}`);
      }

      if (stateId) {
        sqlParams.push(stateId);
        conditions.push(`d.state_id = $${sqlParams.length}`);
      }

      if (search && search.trim()) {
        sqlParams.push(`%${search.trim()}%`);
        conditions.push(`t.name ILIKE $${sqlParams.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      let limitClause = '';
      if (limit) {
        sqlParams.push(Math.max(1, Math.min(500, Number(limit))));
        limitClause = `LIMIT $${sqlParams.length}`;
      }

      const queryStr = `
        SELECT 
          t.id, 
          t.district_id AS "districtId", 
          d.name AS "districtName",
          d.state_id AS "stateId",
          s.name AS "stateName",
          t.name, 
          t.created_at AS "createdAt", 
          t.updated_at AS "updatedAt" 
        FROM talukas t
        INNER JOIN districts d ON t.district_id = d.id
        INNER JOIN states s ON d.state_id = s.id
        ${whereClause}
        ORDER BY s.name ASC, d.name ASC, t.name ASC
        ${limitClause}
      `;
      const res = await executeTenantQuery(queryStr, sqlParams, tenantDbName);
      return res.rows;
    };

    if (cacheKey) {
      return await CacheService.getOrSet(cacheKey, 3600, fetchTalukas);
    }
    return fetchTalukas();
  }

  async createTenantTaluka(input: CreateTalukaInput, tenantDbName?: string | null) {
    const { districtId, name } = input;
    if (!districtId || !name) {
      throw ApiError.badRequest('districtId and name are required');
    }

    const res = await executeTenantQuery(
      `INSERT INTO talukas (district_id, name)
       VALUES ($1, $2)
       RETURNING id, district_id AS "districtId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [districtId, name],
      tenantDbName
    );
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:talukas*`);
    return res.rows[0];
  }

  async updateTenantTaluka(id: string, input: Partial<CreateTalukaInput>, tenantDbName?: string | null) {
    const { districtId, name } = input;
    const res = await executeTenantQuery(
      `UPDATE talukas
       SET district_id = COALESCE($1, district_id),
           name = COALESCE($2, name),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, district_id AS "districtId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [districtId || null, name || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Taluka not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:talukas*`);
    return res.rows[0];
  }

  async deleteTenantTaluka(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM talukas WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Taluka not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:talukas*`);
  }

  async getTenantVillages(
    params?: { talukaId?: string; districtId?: string; stateId?: string; search?: string; page?: number; limit?: number },
    tenantDbName?: string | null
  ) {
    const isFiltered = !!params?.search;
    const cacheKey = !isFiltered ? `ranniti:tenant:${tenantDbName || 'master'}:villages:${JSON.stringify(params || {})}` : null;

    const fetchVillages = async () => {
      let baseFrom = `
        FROM villages v
        LEFT JOIN talukas t ON t.id = v.taluka_id
        LEFT JOIN districts d ON d.id = t.district_id
        LEFT JOIN states s ON d.state_id = s.id
      `;
      const sqlParams: any[] = [];
      const conditions: string[] = [];

      if (params?.talukaId) {
        sqlParams.push(params.talukaId);
        conditions.push(`v.taluka_id = $${sqlParams.length}`);
      }

      if (params?.districtId) {
        sqlParams.push(params.districtId);
        conditions.push(`t.district_id = $${sqlParams.length}`);
      }

      if (params?.stateId) {
        sqlParams.push(params.stateId);
        conditions.push(`d.state_id = $${sqlParams.length}`);
      }

      if (params?.search && params.search.trim()) {
        sqlParams.push(`%${params.search.trim()}%`);
        const p = `$${sqlParams.length}`;
        conditions.push(`(v.name ILIKE ${p} OR t.name ILIKE ${p} OR d.name ILIKE ${p})`);
      }

      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

      if (params?.page || params?.limit) {
        const page = Math.max(1, params?.page || 1);
        const limit = Math.max(1, Math.min(500, params?.limit || 25));
        const offset = (page - 1) * limit;

        const countRes = await executeTenantQuery(`SELECT COUNT(*) as total ${baseFrom}${whereClause}`, sqlParams, tenantDbName);
        const total = parseInt(countRes.rows[0]?.total || '0', 10);
        const totalPages = Math.ceil(total / limit);

        const queryStr = `
          SELECT 
            v.id, 
            v.taluka_id AS "talukaId", 
            t.name AS "talukaName",
            t.district_id AS "districtId",
            d.name AS "districtName",
            d.state_id AS "stateId",
            s.name AS "stateName",
            v.name, 
            v.created_at AS "createdAt", 
            v.updated_at AS "updatedAt"
          ${baseFrom}${whereClause}
          ORDER BY s.name ASC, d.name ASC, t.name ASC, v.name ASC
          LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}
        `;
        const dataRes = await executeTenantQuery(queryStr, [...sqlParams, limit, offset], tenantDbName);
        return { villages: dataRes.rows, pagination: { total, page, limit, totalPages } };
      }

      const queryStr = `
        SELECT 
          v.id, 
          v.taluka_id AS "talukaId", 
          t.name AS "talukaName",
          t.district_id AS "districtId",
          d.name AS "districtName",
          d.state_id AS "stateId",
          s.name AS "stateName",
          v.name, 
          v.created_at AS "createdAt", 
          v.updated_at AS "updatedAt"
        ${baseFrom}${whereClause}
        ORDER BY s.name ASC, d.name ASC, t.name ASC, v.name ASC
      `;
      const res = await executeTenantQuery(queryStr, sqlParams, tenantDbName);
      return res.rows;
    };

    if (cacheKey) {
      return await CacheService.getOrSet(cacheKey, 3600, fetchVillages);
    }
    return await fetchVillages();
  }

  async createTenantVillage(input: CreateVillageInput, tenantDbName?: string | null) {
    const { talukaId, name } = input;
    if (!talukaId || !name) {
      throw ApiError.badRequest('talukaId and name are required');
    }

    const res = await executeTenantQuery(
      `INSERT INTO villages (taluka_id, name)
       VALUES ($1, $2)
       RETURNING id, taluka_id AS "talukaId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [talukaId, name],
      tenantDbName
    );
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:villages*`);
    return res.rows[0];
  }

  async updateTenantVillage(id: string, input: Partial<CreateVillageInput>, tenantDbName?: string | null) {
    const { talukaId, name } = input;
    const res = await executeTenantQuery(
      `UPDATE villages
       SET taluka_id = COALESCE($1, taluka_id),
           name = COALESCE($2, name),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, taluka_id AS "talukaId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [talukaId || null, name || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Village not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:villages*`);
    return res.rows[0];
  }

  async deleteTenantVillage(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM villages WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Village not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:villages*`);
  }

  // --- REFERENCE MASTER DATA (RELIGIONS, CASTES, PARTIES) ---
  async getTenantReligions(tenantDbName?: string | null) {
    const cacheKey = `ranniti:tenant:${tenantDbName || 'master'}:religions`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      const res = await executeTenantQuery(
        `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" 
         FROM religions 
         ORDER BY name ASC`,
        [],
        tenantDbName
      );
      return res.rows;
    });
  }

  async getTenantCastes(religionId?: string, tenantDbName?: string | null) {
    const cacheKey = `ranniti:tenant:${tenantDbName || 'master'}:castes:${religionId || 'all'}`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      let queryStr = `
        SELECT 
          c.id, 
          c.name, 
          c.category, 
          c.religion_id AS "religionId", 
          r.name AS "religionName",
          c.parent_caste_id AS "parentCasteId",
          pc.name AS "parentCasteName",
          c.created_at AS "createdAt", 
          c.updated_at AS "updatedAt" 
        FROM castes c 
        LEFT JOIN religions r ON c.religion_id = r.id
        LEFT JOIN castes pc ON c.parent_caste_id = pc.id
      `;
      const params: any[] = [];
      if (religionId) {
        params.push(religionId);
        queryStr += ` WHERE c.religion_id = $1`;
      }
      queryStr += ` ORDER BY c.category ASC, c.name ASC`;
      const res = await executeTenantQuery(queryStr, params, tenantDbName);
      return res.rows;
    });
  }

  async createTenantCaste(input: CreateCasteInput, tenantDbName?: string | null) {
    const { name, category, religionId, parentCasteId } = input;
    if (!name || !category) {
      throw ApiError.badRequest('name and category are required');
    }

    const res = await executeTenantQuery(
      `INSERT INTO castes (name, category, religion_id, parent_caste_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, category, religion_id AS "religionId", parent_caste_id AS "parentCasteId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, category, religionId || null, parentCasteId || null],
      tenantDbName
    );
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:castes*`);
    return res.rows[0];
  }

  async updateTenantCaste(id: string, input: Partial<CreateCasteInput>, tenantDbName?: string | null) {
    const { name, category, religionId, parentCasteId } = input;
    const res = await executeTenantQuery(
      `UPDATE castes
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           religion_id = COALESCE($3, religion_id),
           parent_caste_id = COALESCE($4, parent_caste_id),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, category, religion_id AS "religionId", parent_caste_id AS "parentCasteId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name || null, category || null, religionId || null, parentCasteId || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Caste not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:castes*`);
    return res.rows[0];
  }

  async deleteTenantCaste(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM castes WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Caste not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:castes*`);
  }

  async getTenantParties(tenantDbName?: string | null) {
    const cacheKey = `ranniti:tenant:${tenantDbName || 'master'}:parties`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      const res = await executeTenantQuery(
        `SELECT id, name, abbreviation, symbol_logo AS "symbolLogo", alliance, color, created_at AS "createdAt", updated_at AS "updatedAt" 
         FROM parties 
         ORDER BY name ASC`,
        [],
        tenantDbName
      );
      return res.rows;
    });
  }

  async createTenantParty(input: CreatePartyInput, tenantDbName?: string | null) {
    const { name, abbreviation, symbolLogo, alliance, color } = input;
    if (!name || !abbreviation) {
      throw ApiError.badRequest('name and abbreviation are required');
    }

    const res = await executeTenantQuery(
      `INSERT INTO parties (name, abbreviation, symbol_logo, alliance, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, abbreviation, symbol_logo AS "symbolLogo", alliance, color, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, abbreviation, symbolLogo || null, alliance || null, color || null],
      tenantDbName
    );
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:parties*`);
    return res.rows[0];
  }

  async getTenantProfessionCategories(tenantDbName?: string | null) {
    const cacheKey = `ranniti:tenant:${tenantDbName || 'master'}:profession_categories`;
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      const res = await executeTenantQuery(
        `SELECT pc.id, pc.name,
                pc.created_at AS "createdAt", pc.updated_at AS "updatedAt",
                COUNT(p.id)::int AS "professionCount"
         FROM profession_categories pc
         LEFT JOIN professions p ON p.category_id = pc.id
         GROUP BY pc.id
         ORDER BY pc.name ASC`,
        [],
        tenantDbName
      );
      return res.rows;
    });
  }

  async createTenantProfessionCategory(input: CreateProfessionCategoryInput, tenantDbName?: string | null) {
    const { name } = input;
    if (!name) throw ApiError.badRequest('name is required');

    const res = await executeTenantQuery(
      `INSERT INTO profession_categories (name)
       VALUES ($1)
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name],
      tenantDbName
    );
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:profession_categories*`);
    return res.rows[0];
  }

  async updateTenantProfessionCategory(id: string, input: Partial<CreateProfessionCategoryInput>, tenantDbName?: string | null) {
    const { name } = input;
    const res = await executeTenantQuery(
      `UPDATE profession_categories
       SET name = COALESCE($1, name),
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Profession Category not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:profession_categories*`);
    return res.rows[0];
  }

  async deleteTenantProfessionCategory(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM profession_categories WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Profession Category not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:profession_categories*`);
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:professions*`);
  }

  async getTenantProfessions(
    paramsOrCategoryId?: string | { categoryId?: string; search?: string; limit?: number },
    tenantDbNameParam?: string | null
  ) {
    let categoryId: string | undefined;
    let search: string | undefined;
    let limit: number | undefined;
    let tenantDbName: string | null | undefined = tenantDbNameParam;

    if (typeof paramsOrCategoryId === 'object' && paramsOrCategoryId !== null) {
      categoryId = paramsOrCategoryId.categoryId;
      search = paramsOrCategoryId.search;
      limit = paramsOrCategoryId.limit;
    } else {
      categoryId = paramsOrCategoryId;
    }

    const isFiltered = Boolean(search?.trim());
    const cacheKey = !isFiltered
      ? `ranniti:tenant:${tenantDbName || 'master'}:professions:${categoryId || 'all'}:${limit || 'all'}`
      : null;

    const fetchProfessions = async () => {
      let queryStr = `
        SELECT 
          p.id, 
          p.category_id AS "categoryId", 
          pc.name AS "categoryName",
          p.name, 
          p.created_at AS "createdAt", 
          p.updated_at AS "updatedAt"
        FROM professions p
        LEFT JOIN profession_categories pc ON p.category_id = pc.id
      `;
      const conditions: string[] = [];
      const params: any[] = [];

      if (categoryId) {
        params.push(categoryId);
        conditions.push(`p.category_id = $${params.length}`);
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        conditions.push(`p.name ILIKE $${params.length}`);
      }

      if (conditions.length > 0) {
        queryStr += ` WHERE ${conditions.join(' AND ')}`;
      }

      queryStr += ` ORDER BY pc.name ASC, p.name ASC`;

      if (limit) {
        params.push(Math.max(1, Math.min(500, Number(limit))));
        queryStr += ` LIMIT $${params.length}`;
      }

      const res = await executeTenantQuery(queryStr, params, tenantDbName);
      return res.rows;
    };

    if (cacheKey) {
      return await CacheService.getOrSet(cacheKey, 3600, fetchProfessions);
    }
    return fetchProfessions();
  }

  async createTenantProfession(input: CreateProfessionInput, tenantDbName?: string | null) {
    const { categoryId, name } = input;
    if (!categoryId || !name) throw ApiError.badRequest('categoryId and name are required');

    const res = await executeTenantQuery(
      `INSERT INTO professions (category_id, name)
       VALUES ($1, $2)
       RETURNING id, category_id AS "categoryId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [categoryId, name],
      tenantDbName
    );
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:professions*`);
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:profession_categories*`);
    return res.rows[0];
  }

  async updateTenantProfession(id: string, input: Partial<CreateProfessionInput>, tenantDbName?: string | null) {
    const { categoryId, name } = input;
    const res = await executeTenantQuery(
      `UPDATE professions
       SET category_id = COALESCE($1, category_id),
           name = COALESCE($2, name),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, category_id AS "categoryId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [categoryId || null, name || null, id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Profession not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:professions*`);
    return res.rows[0];
  }

  async deleteTenantProfession(id: string, tenantDbName?: string | null) {
    const res = await executeTenantQuery(
      `DELETE FROM professions WHERE id = $1 RETURNING id`,
      [id],
      tenantDbName
    );
    if (res.rows.length === 0) throw ApiError.notFound('Profession not found');
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:professions*`);
    await CacheService.invalidatePattern(`ranniti:tenant:${tenantDbName || '*'}:profession_categories*`);
  }

  // --- VOTERS ---
  async getTenantVoters(
    userId: string,
    filters: { page?: number; limit?: number; search?: string; boothId?: string; acId?: string },
    tenantDbName?: string | null
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const acIds = tenantDbName ? [] : await this.getAssignedAcIds(userId);

    let whereClause = ` WHERE 1=1`;
    const params: any[] = [];

    if (filters.acId) {
      params.push(filters.acId);
      whereClause += ` AND v.ac_id = $${params.length}`;
    } else if (acIds.length > 0) {
      params.push(acIds);
      whereClause += ` AND v.ac_id = ANY($${params.length}::uuid[])`;
    }

    if (filters.boothId) {
      params.push(filters.boothId);
      whereClause += ` AND v.booth_id = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      whereClause += ` AND (v.voter_name ILIKE $${params.length} OR v.epic_no ILIKE $${params.length} OR v.mobile_number ILIKE $${params.length})`;
    }

    const countRes = await executeTenantQuery(`SELECT COUNT(*)::int as total FROM voters v ${whereClause}`, params, tenantDbName);
    const total = countRes.rows[0]?.total || 0;

    const cteSortClause = filters.boothId
      ? 'v.serial_no ASC NULLS LAST, v.id ASC'
      : 'v.booth_number ASC NULLS LAST, v.serial_no ASC NULLS LAST, v.id ASC';

    params.push(limit, offset);
    const queryStr = `
      WITH paged_voters AS (
        SELECT v.id
        FROM voters v
        ${whereClause}
        ORDER BY ${cteSortClause}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      )
      SELECT v.id, v.epic_no as "epicNo", v.voter_name as "voterName", v.gender, v.age,
             v.mobile_number as "mobileNumber", v.address, v.ac_id as "acId", v.booth_id as "boothId",
             b.name as "boothName", a.name as "acName"
      FROM paged_voters pv
      JOIN voters v ON pv.id = v.id
      LEFT JOIN booths b ON b.id = v.booth_id
      LEFT JOIN assembly_constituencies a ON a.id = v.ac_id
      ORDER BY b.booth_number ASC NULLS LAST, v.serial_no ASC NULLS LAST, v.id ASC
    `;

    const dataRes = await executeTenantQuery(queryStr, params, tenantDbName);

    return {
      voters: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const tenantApiService = new TenantApiService();
