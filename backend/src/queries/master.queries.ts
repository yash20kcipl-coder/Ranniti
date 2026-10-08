import { query } from './dbPool';
import { CacheService } from '../services/cache.service';
import {
  Religion,
  Caste,
  State,
  District,
  Taluka,
  Village,
  ParliamentaryConstituency,
  AssemblyConstituency,
  Ward,
  Booth,
  Party,
} from '../models/master.model';

export class MasterQueries {
  // --- RELIGIONS ---
  static async getReligions(): Promise<Religion[]> {
    return CacheService.getOrSet('ranniti:masters:religions', 604800, async () => {
      const res = await query(
        `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" 
         FROM religions 
         ORDER BY name ASC`
      );
      return res.rows;
    });
  }

  static async getReligionById(id: string): Promise<Religion | null> {
    const res = await query(
      `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" 
       FROM religions 
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createReligion(name: string): Promise<Religion> {
    const res = await query(
      `INSERT INTO religions (name) 
       VALUES ($1) 
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name]
    );
    await CacheService.invalidatePattern('ranniti:masters:religions*');
    return res.rows[0];
  }

  static async updateReligion(id: string, name?: string): Promise<Religion | null> {
    const res = await query(
      `UPDATE religions 
       SET name = COALESCE($2, name), updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:religions*');
    return res.rows[0] || null;
  }

  static async deleteReligion(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM religions WHERE id = $1`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:religions*');
    return (res.rowCount || 0) > 0;
  }

  // --- CASTES ---
  static async getCastes(): Promise<Caste[]> {
    return CacheService.getOrSet('ranniti:masters:castes', 86400, async () => {
      const res = await query(
        `SELECT 
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
         ORDER BY c.category ASC, c.name ASC`
      );
      return res.rows;
    });
  }

  static async createCaste(
    name: string,
    category: string,
    religionId?: string,
    parentCasteId?: string,
    religionName?: string,
    parentCasteName?: string
  ): Promise<Caste> {
    let targetReligionId = religionId || null;
    if (!targetReligionId && religionName && religionName.trim()) {
      const cleanRelName = religionName.trim();
      const existingRel = await query(`SELECT id FROM religions WHERE LOWER(name) = LOWER($1)`, [cleanRelName]);
      if (existingRel.rows[0]) {
        targetReligionId = existingRel.rows[0].id;
      } else {
        const newRel = await query(
          `INSERT INTO religions (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`,
          [cleanRelName]
        );
        targetReligionId = newRel.rows[0].id;
        await CacheService.invalidatePattern('ranniti:masters:religions*');
      }
    }

    let targetParentCasteId = parentCasteId || null;
    if (!targetParentCasteId && parentCasteName && parentCasteName.trim()) {
      const cleanParentName = parentCasteName.trim();
      const existingParent = await query(`SELECT id FROM castes WHERE LOWER(name) = LOWER($1)`, [cleanParentName]);
      if (existingParent.rows[0]) {
        targetParentCasteId = existingParent.rows[0].id;
      } else {
        const newParent = await query(
          `INSERT INTO castes (name, category, religion_id) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`,
          [cleanParentName, category || 'General', targetReligionId]
        );
        targetParentCasteId = newParent.rows[0].id;
      }
    }

    const res = await query(
      `INSERT INTO castes (name, category, religion_id, parent_caste_id) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (name) DO UPDATE SET
         category = EXCLUDED.category,
         religion_id = COALESCE(EXCLUDED.religion_id, castes.religion_id),
         parent_caste_id = COALESCE(EXCLUDED.parent_caste_id, castes.parent_caste_id),
         updated_at = NOW()
       RETURNING id, name, category, religion_id AS "religionId", parent_caste_id AS "parentCasteId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, category || 'General', targetReligionId, targetParentCasteId]
    );
    await CacheService.invalidatePattern('ranniti:masters:castes*');
    return res.rows[0];
  }

  static async upsertReligionByName(name: string): Promise<string | null> {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;

    const existing = await query(
      `SELECT id FROM religions WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
      [cleanName]
    );
    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    try {
      const inserted = await query(
        `INSERT INTO religions (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [cleanName]
      );
      await CacheService.invalidatePattern('ranniti:masters:religions*');
      return inserted.rows[0]?.id || null;
    } catch {
      const fallback = await query(
        `SELECT id FROM religions WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
        [cleanName]
      );
      return fallback.rows[0]?.id || null;
    }
  }

  static async upsertCasteByName(
    name: string,
    religionId?: string | null,
    category: string = 'General'
  ): Promise<string | null> {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;

    // Check if caste already exists (as primary caste)
    const existing = await query(
      `SELECT id, religion_id FROM castes WHERE LOWER(TRIM(name)) = LOWER($1) AND parent_caste_id IS NULL LIMIT 1`,
      [cleanName]
    );
    if (existing.rows[0]) {
      if (!existing.rows[0].religion_id && religionId) {
        await query(`UPDATE castes SET religion_id = $1, updated_at = NOW() WHERE id = $2`, [religionId, existing.rows[0].id]);
        await CacheService.invalidatePattern('ranniti:masters:castes*');
      }
      return existing.rows[0].id;
    }

    try {
      const inserted = await query(
        `INSERT INTO castes (name, category, religion_id, parent_caste_id) 
         VALUES ($1, $2, $3, NULL) 
         ON CONFLICT (name) DO UPDATE SET 
           religion_id = COALESCE(castes.religion_id, EXCLUDED.religion_id),
           updated_at = NOW()
         RETURNING id`,
        [cleanName, category || 'General', religionId || null]
      );
      await CacheService.invalidatePattern('ranniti:masters:castes*');
      return inserted.rows[0]?.id || null;
    } catch {
      const fallback = await query(
        `SELECT id FROM castes WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
        [cleanName]
      );
      return fallback.rows[0]?.id || null;
    }
  }

  static async upsertSubcasteByName(
    name: string,
    parentCasteId?: string | null,
    religionId?: string | null
  ): Promise<string | null> {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;

    if (parentCasteId) {
      const existing = await query(
        `SELECT id FROM castes WHERE LOWER(TRIM(name)) = LOWER($1) AND parent_caste_id = $2 LIMIT 1`,
        [cleanName, parentCasteId]
      );
      if (existing.rows[0]) {
        return existing.rows[0].id;
      }
    } else {
      const existing = await query(
        `SELECT id FROM castes WHERE LOWER(TRIM(name)) = LOWER($1) AND parent_caste_id IS NOT NULL LIMIT 1`,
        [cleanName]
      );
      if (existing.rows[0]) {
        return existing.rows[0].id;
      }
    }

    try {
      const inserted = await query(
        `INSERT INTO castes (name, category, religion_id, parent_caste_id) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO UPDATE SET 
           parent_caste_id = COALESCE(castes.parent_caste_id, EXCLUDED.parent_caste_id),
           religion_id = COALESCE(castes.religion_id, EXCLUDED.religion_id),
           updated_at = NOW()
         RETURNING id`,
        [cleanName, 'General', religionId || null, parentCasteId || null]
      );
      await CacheService.invalidatePattern('ranniti:masters:castes*');
      return inserted.rows[0]?.id || null;
    } catch {
      const fallback = await query(
        `SELECT id FROM castes WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
        [cleanName]
      );
      return fallback.rows[0]?.id || null;
    }
  }

  // --- STATES ---
  static async getStates(): Promise<State[]> {
    return CacheService.getOrSet('ranniti:masters:states', 604800, async () => {
      const res = await query(
        `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" 
         FROM states 
         ORDER BY name ASC`
      );
      return res.rows;
    });
  }

  static async createState(name: string): Promise<State> {
    const res = await query(
      `INSERT INTO states (name) 
       VALUES ($1) 
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name]
    );
    await CacheService.invalidatePattern('ranniti:masters:states*');
    return res.rows[0];
  }

  // --- DISTRICTS ---
  static async getDistricts(stateId?: string): Promise<District[]> {
    const key = stateId ? `ranniti:masters:districts:state:${stateId}` : 'ranniti:masters:districts';
    return CacheService.getOrSet(key, 86400, async () => {
      const params: any[] = [];
      let whereClause = '';

      if (stateId) {
        params.push(stateId);
        whereClause = 'WHERE d.state_id = $1';
      }

      const sql = `
        SELECT 
          d.id, 
          d.state_id AS "stateId", 
          s.name AS "stateName",
          d.name, 
          d.created_at AS "createdAt", 
          d.updated_at AS "updatedAt" 
        FROM districts d
        INNER JOIN states s ON d.state_id = s.id
        ${whereClause}
        ORDER BY s.name ASC, d.name ASC
      `;

      const res = await query(sql, params);
      return res.rows;
    });
  }

  static async createDistrict(stateId: string, name: string): Promise<District> {
    const res = await query(
      `INSERT INTO districts (state_id, name) 
       VALUES ($1, $2) 
       RETURNING id, state_id AS "stateId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [stateId, name]
    );
    await CacheService.invalidatePattern('ranniti:masters:districts*');
    return res.rows[0];
  }

  // --- TALUKAS ---
  static async getTalukas(districtId?: string, stateId?: string): Promise<Taluka[]> {
    const key = `ranniti:masters:talukas:${districtId || 'all'}:${stateId || 'all'}`;
    return CacheService.getOrSet(key, 86400, async () => {
      const params: any[] = [];
      const conditions: string[] = [];

      if (districtId) {
        params.push(districtId);
        conditions.push(`t.district_id = $${params.length}`);
      }

      if (stateId) {
        params.push(stateId);
        conditions.push(`d.state_id = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const sql = `
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
      `;

      const res = await query(sql, params);
      return res.rows;
    });
  }

  static async getTalukaById(id: string): Promise<Taluka | null> {
    const sql = `
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
      WHERE t.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  static async createTaluka(districtId: string, name: string): Promise<Taluka> {
    const res = await query(
      `INSERT INTO talukas (district_id, name) 
       VALUES ($1, $2) 
       RETURNING id, district_id AS "districtId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [districtId, name]
    );
    await CacheService.invalidatePattern('ranniti:masters:talukas*');
    return res.rows[0];
  }

  static async updateTaluka(id: string, districtId?: string, name?: string): Promise<Taluka | null> {
    const res = await query(
      `UPDATE talukas 
       SET district_id = COALESCE($2, district_id), name = COALESCE($3, name), updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, district_id AS "districtId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, districtId || null, name || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:talukas*');
    return res.rows[0] || null;
  }

  static async deleteTaluka(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM talukas WHERE id = $1`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:talukas*');
    return (res.rowCount || 0) > 0;
  }

  static async upsertTalukaByName(name: string, districtId?: string): Promise<string | null> {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;

    const existing = await query(
      `SELECT id FROM talukas WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
      [cleanName]
    );
    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    if (!districtId) return null;

    try {
      const inserted = await query(
        `INSERT INTO talukas (district_id, name) VALUES ($1, $2) RETURNING id`,
        [districtId, cleanName]
      );
      return inserted.rows[0]?.id || null;
    } catch {
      const fallback = await query(
        `SELECT id FROM talukas WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
        [cleanName]
      );
      return fallback.rows[0]?.id || null;
    }
  }

  static async upsertVillageByName(name: string, talukaId?: string): Promise<string | null> {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;

    const existing = await query(
      `SELECT id FROM villages WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
      [cleanName]
    );
    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    if (!talukaId) return null;

    try {
      const inserted = await query(
        `INSERT INTO villages (taluka_id, name) VALUES ($1, $2) RETURNING id`,
        [talukaId, cleanName]
      );
      return inserted.rows[0]?.id || null;
    } catch {
      const fallback = await query(
        `SELECT id FROM villages WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
        [cleanName]
      );
      return fallback.rows[0]?.id || null;
    }
  }

  // --- VILLAGES ---
  static async getVillages(
    filterOrTalukaId?: string | { talukaId?: string; districtId?: string; stateId?: string; search?: string; page?: number; limit?: number },
    districtIdParam?: string,
    stateIdParam?: string
  ): Promise<any> {
    let talukaId: string | undefined;
    let districtId: string | undefined = districtIdParam;
    let stateId: string | undefined = stateIdParam;
    let search: string | undefined;
    let page: number | undefined;
    let limit: number | undefined;

    if (typeof filterOrTalukaId === 'object' && filterOrTalukaId !== null) {
      talukaId = filterOrTalukaId.talukaId;
      districtId = filterOrTalukaId.districtId;
      stateId = filterOrTalukaId.stateId;
      search = filterOrTalukaId.search;
      page = filterOrTalukaId.page;
      limit = filterOrTalukaId.limit;
    } else {
      talukaId = filterOrTalukaId as string | undefined;
    }

    const params: any[] = [];
    const conditions: string[] = [];

    if (talukaId) {
      params.push(talukaId);
      conditions.push(`v.taluka_id = $${params.length}`);
    }

    if (districtId) {
      params.push(districtId);
      conditions.push(`t.district_id = $${params.length}`);
    }

    if (stateId) {
      params.push(stateId);
      conditions.push(`d.state_id = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`v.name ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (page && limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(500, Number(limit) || 25));
      const offsetNum = (pageNum - 1) * limitNum;

      const countSql = `
        SELECT COUNT(*)::int AS total
        FROM villages v
        INNER JOIN talukas t ON v.taluka_id = t.id
        INNER JOIN districts d ON t.district_id = d.id
        INNER JOIN states s ON d.state_id = s.id
        ${whereClause}
      `;
      const countRes = await query(countSql, params);
      const total = countRes.rows[0]?.total || 0;

      const dataParams = [...params, limitNum, offsetNum];
      const dataSql = `
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
        FROM villages v
        INNER JOIN talukas t ON v.taluka_id = t.id
        INNER JOIN districts d ON t.district_id = d.id
        INNER JOIN states s ON d.state_id = s.id
        ${whereClause}
        ORDER BY s.name ASC, d.name ASC, t.name ASC, v.name ASC
        LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
      `;

      const dataRes = await query(dataSql, dataParams);
      return {
        villages: dataRes.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      };
    }

    // Unpaginated fallback (with Redis cache)
    const key = `ranniti:masters:villages:${talukaId || 'all'}:${districtId || 'all'}:${stateId || 'all'}:${search || 'all'}`;
    return CacheService.getOrSet(key, 86400, async () => {
      const sql = `
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
        FROM villages v
        INNER JOIN talukas t ON v.taluka_id = t.id
        INNER JOIN districts d ON t.district_id = d.id
        INNER JOIN states s ON d.state_id = s.id
        ${whereClause}
        ORDER BY s.name ASC, d.name ASC, t.name ASC, v.name ASC
      `;

      const res = await query(sql, params);
      return res.rows;
    });
  }

  static async getVillageById(id: string): Promise<Village | null> {
    const sql = `
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
      FROM villages v
      INNER JOIN talukas t ON v.taluka_id = t.id
      INNER JOIN districts d ON t.district_id = d.id
      INNER JOIN states s ON d.state_id = s.id
      WHERE v.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  static async createVillage(talukaId: string, name: string): Promise<Village> {
    const res = await query(
      `INSERT INTO villages (taluka_id, name) 
       VALUES ($1, $2) 
       RETURNING id, taluka_id AS "talukaId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [talukaId, name]
    );
    await CacheService.invalidatePattern('ranniti:masters:villages*');
    return res.rows[0];
  }

  static async updateVillage(id: string, talukaId?: string, name?: string): Promise<Village | null> {
    const res = await query(
      `UPDATE villages 
       SET taluka_id = COALESCE($2, taluka_id), name = COALESCE($3, name), updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, taluka_id AS "talukaId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, talukaId || null, name || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:villages*');
    return res.rows[0] || null;
  }

  static async deleteVillage(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM villages WHERE id = $1`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:villages*');
    return (res.rowCount || 0) > 0;
  }

  // --- PARLIAMENTARY CONSTITUENCIES (PC) ---
  static async getPcs(stateId?: string): Promise<ParliamentaryConstituency[]> {
    const key = stateId ? `ranniti:masters:pcs:state:${stateId}` : 'ranniti:masters:pcs';
    return CacheService.getOrSet(key, 86400, async () => {
      const params: any[] = [];
      let whereClause = '';

      if (stateId) {
        params.push(stateId);
        whereClause = 'WHERE p.state_id = $1';
      }

      const sql = `
        SELECT 
          p.id, 
          p.state_id AS "stateId", 
          s.name AS "stateName",
          p.pc_number AS "pcNumber", 
          p.name, 
          p.created_at AS "createdAt", 
          p.updated_at AS "updatedAt" 
        FROM parliamentary_constituencies p
        INNER JOIN states s ON p.state_id = s.id
        ${whereClause}
        ORDER BY p.pc_number ASC
      `;

      const res = await query(sql, params);
      return res.rows;
    });
  }

  static async createPc(stateId: string, pcNumber: number, name: string): Promise<ParliamentaryConstituency> {
    const res = await query(
      `INSERT INTO parliamentary_constituencies (state_id, pc_number, name) 
       VALUES ($1, $2, $3) 
       RETURNING id, state_id AS "stateId", pc_number AS "pcNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [stateId, pcNumber, name]
    );
    await CacheService.invalidatePattern('ranniti:masters:pcs*');
    return res.rows[0];
  }

  // --- ASSEMBLY CONSTITUENCIES (AC) ---
  static async getAcs(pcId?: string, districtId?: string, stateId?: string): Promise<AssemblyConstituency[]> {
    const key = `ranniti:masters:acs:${pcId || 'all'}:${districtId || 'all'}:${stateId || 'all'}`;
    return CacheService.getOrSet(key, 86400, async () => {
      const params: any[] = [];
      const conditions: string[] = [];

      if (pcId) {
        params.push(pcId);
        conditions.push(`a.pc_id = $${params.length}`);
      }
      if (districtId) {
        params.push(districtId);
        conditions.push(`a.district_id = $${params.length}`);
      }
      if (stateId) {
        params.push(stateId);
        conditions.push(`(p.state_id = $${params.length} OR d.state_id = $${params.length})`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const sql = `
        SELECT 
          a.id, 
          a.pc_id AS "pcId", 
          p.name AS "pcName",
          a.district_id AS "districtId", 
          d.name AS "districtName",
          COALESCE(sp.id, sd.id) AS "stateId",
          COALESCE(sp.name, sd.name) AS "stateName",
          a.ac_number AS "acNumber", 
          a.name, 
          a.created_at AS "createdAt", 
          a.updated_at AS "updatedAt" 
        FROM assembly_constituencies a
        LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
        LEFT JOIN states sp ON p.state_id = sp.id
        LEFT JOIN districts d ON a.district_id = d.id
        LEFT JOIN states sd ON d.state_id = sd.id
        ${whereClause}
        ORDER BY a.ac_number ASC
      `;

      const res = await query(sql, params);
      return res.rows;
    });
  }

  static async createAc(pcId: string, acNumber: number, name: string, districtId?: string): Promise<AssemblyConstituency> {
    const res = await query(
      `INSERT INTO assembly_constituencies (pc_id, ac_number, name, district_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, pc_id AS "pcId", district_id AS "districtId", ac_number AS "acNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [pcId, acNumber, name, districtId || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:acs*');
    return res.rows[0];
  }

  // --- PARTIES ---
  static async getParties(): Promise<Party[]> {
    return CacheService.getOrSet('ranniti:masters:parties', 86400, async () => {
      const res = await query(
        `SELECT id, name, abbreviation, symbol_logo AS "symbolLogo", alliance, created_at AS "createdAt", updated_at AS "updatedAt" 
         FROM parties 
         ORDER BY name ASC`
      );
      return res.rows;
    });
  }

  static async getPartyById(id: string): Promise<Party | null> {
    const res = await query(
      `SELECT id, name, abbreviation, symbol_logo AS "symbolLogo", alliance, created_at AS "createdAt", updated_at AS "updatedAt" 
       FROM parties WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createParty(name: string, abbreviation: string, symbolLogo?: string, alliance?: string): Promise<Party> {
    const res = await query(
      `INSERT INTO parties (name, abbreviation, symbol_logo, alliance) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, abbreviation, symbol_logo AS "symbolLogo", alliance, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, abbreviation, symbolLogo || null, alliance || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:parties*');
    return res.rows[0];
  }

  static async updateParty(id: string, name?: string, abbreviation?: string, symbolLogo?: string, alliance?: string): Promise<Party | null> {
    const res = await query(
      `UPDATE parties 
       SET name = COALESCE($2, name), 
           abbreviation = COALESCE($3, abbreviation), 
           symbol_logo = COALESCE($4, symbol_logo),
           alliance = COALESCE($5, alliance),
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, abbreviation, symbol_logo AS "symbolLogo", alliance, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name || null, abbreviation || null, symbolLogo || null, alliance || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:parties*');
    return res.rows[0] || null;
  }

  static async deleteParty(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM parties WHERE id = $1 RETURNING id`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:parties*');
    return (res.rowCount || 0) > 0;
  }

  // --- WARDS ---
  static async getWards(
    filterOrAcId?: string | { acId?: string; pcId?: string; districtId?: string; stateId?: string; search?: string; page?: number; limit?: number },
    acIdParam?: string
  ): Promise<any> {
    let acId: string | undefined = acIdParam;
    let pcId: string | undefined;
    let districtId: string | undefined;
    let stateId: string | undefined;
    let search: string | undefined;
    let page: number | undefined;
    let limit: number | undefined;

    if (typeof filterOrAcId === 'object' && filterOrAcId !== null) {
      acId = filterOrAcId.acId || acId;
      pcId = filterOrAcId.pcId;
      districtId = filterOrAcId.districtId;
      stateId = filterOrAcId.stateId;
      search = filterOrAcId.search;
      page = filterOrAcId.page;
      limit = filterOrAcId.limit;
    } else {
      acId = (filterOrAcId as string | undefined) || acId;
    }

    const params: any[] = [];
    const conditions: string[] = [];

    if (acId) {
      params.push(acId);
      conditions.push(`w.ac_id = $${params.length}`);
    }

    if (pcId) {
      params.push(pcId);
      conditions.push(`a.pc_id = $${params.length}`);
    }

    if (districtId) {
      params.push(districtId);
      conditions.push(`a.district_id = $${params.length}`);
    }

    if (stateId) {
      params.push(stateId);
      conditions.push(`(sp.id = $${params.length} OR sd.id = $${params.length})`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(w.name ILIKE $${params.length} OR CAST(w.ward_number AS TEXT) ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (page && limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(500, Number(limit) || 25));
      const offsetNum = (pageNum - 1) * limitNum;

      const countSql = `
        SELECT COUNT(*)::int AS total
        FROM wards w
        LEFT JOIN assembly_constituencies a ON w.ac_id = a.id
        LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
        LEFT JOIN states sp ON p.state_id = sp.id
        LEFT JOIN districts d ON a.district_id = d.id
        LEFT JOIN states sd ON d.state_id = sd.id
        ${whereClause}
      `;
      const countRes = await query(countSql, params);
      const total = countRes.rows[0]?.total || 0;

      const dataParams = [...params, limitNum, offsetNum];
      const dataSql = `
        SELECT 
          w.id,
          w.ac_id AS "acId",
          a.name AS "acName",
          a.ac_number AS "acNumber",
          a.pc_id AS "pcId",
          p.name AS "pcName",
          a.district_id AS "districtId",
          d.name AS "districtName",
          COALESCE(sp.id, sd.id) AS "stateId",
          COALESCE(sp.name, sd.name) AS "stateName",
          w.ward_number AS "wardNumber",
          w.name,
          w.created_at AS "createdAt",
          w.updated_at AS "updatedAt"
        FROM wards w
        LEFT JOIN assembly_constituencies a ON w.ac_id = a.id
        LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
        LEFT JOIN states sp ON p.state_id = sp.id
        LEFT JOIN districts d ON a.district_id = d.id
        LEFT JOIN states sd ON d.state_id = sd.id
        ${whereClause}
        ORDER BY w.ward_number ASC, w.name ASC
        LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
      `;

      const dataRes = await query(dataSql, dataParams);
      return {
        wards: dataRes.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      };
    }

    const sql = `
      SELECT 
        w.id,
        w.ac_id AS "acId",
        a.name AS "acName",
        a.ac_number AS "acNumber",
        a.pc_id AS "pcId",
        p.name AS "pcName",
        a.district_id AS "districtId",
        d.name AS "districtName",
        COALESCE(sp.id, sd.id) AS "stateId",
        COALESCE(sp.name, sd.name) AS "stateName",
        w.ward_number AS "wardNumber",
        w.name,
        w.created_at AS "createdAt",
        w.updated_at AS "updatedAt"
      FROM wards w
      LEFT JOIN assembly_constituencies a ON w.ac_id = a.id
      LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
      LEFT JOIN states sp ON p.state_id = sp.id
      LEFT JOIN districts d ON a.district_id = d.id
      LEFT JOIN states sd ON d.state_id = sd.id
      ${whereClause}
      ORDER BY w.ward_number ASC, w.name ASC
    `;

    const res = await query(sql, params);
    return res.rows;
  }

  static async getWardById(id: string): Promise<Ward | null> {
    const sql = `
      SELECT 
        w.id,
        w.ac_id AS "acId",
        a.name AS "acName",
        a.ac_number AS "acNumber",
        a.pc_id AS "pcId",
        p.name AS "pcName",
        a.district_id AS "districtId",
        d.name AS "districtName",
        COALESCE(sp.id, sd.id) AS "stateId",
        COALESCE(sp.name, sd.name) AS "stateName",
        w.ward_number AS "wardNumber",
        w.name,
        w.created_at AS "createdAt",
        w.updated_at AS "updatedAt"
      FROM wards w
      LEFT JOIN assembly_constituencies a ON w.ac_id = a.id
      LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
      LEFT JOIN states sp ON p.state_id = sp.id
      LEFT JOIN districts d ON a.district_id = d.id
      LEFT JOIN states sd ON d.state_id = sd.id
      WHERE w.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  static async createWard(data: { acId: string; wardNumber: number; name: string }): Promise<Ward> {
    const res = await query(
      `INSERT INTO wards (ac_id, ward_number, name)
       VALUES ($1, $2, $3)
       RETURNING id, ac_id AS "acId", ward_number AS "wardNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [data.acId, data.wardNumber, data.name]
    );
    return res.rows[0];
  }

  static async updateWard(id: string, data: { acId?: string; wardNumber?: number; name?: string }): Promise<Ward | null> {
    const res = await query(
      `UPDATE wards
       SET ac_id = COALESCE($2, ac_id),
           ward_number = COALESCE($3, ward_number),
           name = COALESCE($4, name),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, ac_id AS "acId", ward_number AS "wardNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, data.acId || null, data.wardNumber || null, data.name || null]
    );
    return res.rows[0] || null;
  }

  static async deleteWard(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM wards WHERE id = $1 RETURNING id`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --- BOOTHS ---
  static async getBoothOptions(filter: {
    acId?: string;
    wardId?: string;
    search?: string;
    limit?: number;
  }): Promise<Array<{ id: string; boothNumber: number; name: string; acId: string }>> {
    const { acId, wardId, search, limit = 500 } = filter;
    const conditions: string[] = [];
    const params: any[] = [];

    if (acId) {
      params.push(acId);
      conditions.push(`b.ac_id = $${params.length}`);
    }

    if (wardId) {
      params.push(wardId);
      conditions.push(`b.ward_id = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(b.name ILIKE $${params.length} OR CAST(b.booth_number AS TEXT) ILIKE $${params.length})`);
    }

    // Guard: Prevent full table scan across millions of booths if no scoping param was supplied
    if (conditions.length === 0) {
      return [];
    }

    const maxLimit = Math.min(Math.max(1, limit), 1000);
    params.push(maxLimit);

    const sql = `
      SELECT 
        b.id,
        b.booth_number AS "boothNumber",
        b.name,
        b.ac_id AS "acId",
        b.ward_id AS "wardId"
      FROM booths b
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.booth_number ASC
      LIMIT $${params.length}
    `;

    const res = await query(sql, params);
    return res.rows;
  }

  static async getBooths(
    filterOrAcId?: string | { acId?: string; wardId?: string; pcId?: string; districtId?: string; stateId?: string; search?: string; page?: number; limit?: number },
    wardIdParam?: string
  ): Promise<any> {
    let acId: string | undefined;
    let wardId: string | undefined = wardIdParam;
    let pcId: string | undefined;
    let districtId: string | undefined;
    let stateId: string | undefined;
    let search: string | undefined;
    let page: number | undefined;
    let limit: number | undefined;

    if (typeof filterOrAcId === 'object' && filterOrAcId !== null) {
      acId = filterOrAcId.acId;
      wardId = filterOrAcId.wardId;
      pcId = filterOrAcId.pcId;
      districtId = filterOrAcId.districtId;
      stateId = filterOrAcId.stateId;
      search = filterOrAcId.search;
      page = filterOrAcId.page;
      limit = filterOrAcId.limit;
    } else {
      acId = filterOrAcId as string | undefined;
    }

    const params: any[] = [];
    const conditions: string[] = [];

    if (acId) {
      params.push(acId);
      conditions.push(`b.ac_id = $${params.length}`);
    }

    if (wardId) {
      params.push(wardId);
      conditions.push(`b.ward_id = $${params.length}`);
    }

    if (pcId) {
      params.push(pcId);
      conditions.push(`a.pc_id = $${params.length}`);
    }

    if (districtId) {
      params.push(districtId);
      conditions.push(`a.district_id = $${params.length}`);
    }

    if (stateId) {
      params.push(stateId);
      conditions.push(`(sp.id = $${params.length} OR sd.id = $${params.length})`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(b.name ILIKE $${params.length} OR b.location_building ILIKE $${params.length} OR CAST(b.booth_number AS TEXT) ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (page && limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(500, Number(limit) || 25));
      const offsetNum = (pageNum - 1) * limitNum;

      const countSql = `
        SELECT COUNT(*)::int AS total
        FROM booths b
        LEFT JOIN assembly_constituencies a ON b.ac_id = a.id
        LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
        LEFT JOIN states sp ON p.state_id = sp.id
        LEFT JOIN districts d ON a.district_id = d.id
        LEFT JOIN states sd ON d.state_id = sd.id
        LEFT JOIN wards w ON b.ward_id = w.id
        ${whereClause}
      `;
      const countRes = await query(countSql, params);
      const total = countRes.rows[0]?.total || 0;

      const dataParams = [...params, limitNum, offsetNum];
      const dataSql = `
        SELECT 
          b.id, 
          b.ac_id AS "acId", 
          a.name AS "acName",
          a.ac_number AS "acNumber",
          a.pc_id AS "pcId",
          p.name AS "pcName",
          a.district_id AS "districtId",
          d.name AS "districtName",
          COALESCE(sp.id, sd.id) AS "stateId",
          COALESCE(sp.name, sd.name) AS "stateName",
          b.ward_id AS "wardId",
          w.name AS "wardName",
          w.ward_number AS "wardNumber",
          b.booth_number AS "boothNumber", 
          b.name, 
          b.location_building AS "locationBuilding", 
          b.total_voters AS "totalVoters", 
          b.created_at AS "createdAt", 
          b.updated_at AS "updatedAt" 
        FROM booths b
        LEFT JOIN assembly_constituencies a ON b.ac_id = a.id
        LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
        LEFT JOIN states sp ON p.state_id = sp.id
        LEFT JOIN districts d ON a.district_id = d.id
        LEFT JOIN states sd ON d.state_id = sd.id
        LEFT JOIN wards w ON b.ward_id = w.id
        ${whereClause}
        ORDER BY b.booth_number ASC
        LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
      `;

      const dataRes = await query(dataSql, dataParams);
      return {
        booths: dataRes.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      };
    }

    // Unpaginated fallback
    const sql = `
      SELECT 
        b.id, 
        b.ac_id AS "acId", 
        a.name AS "acName",
        a.ac_number AS "acNumber",
        a.pc_id AS "pcId",
        p.name AS "pcName",
        a.district_id AS "districtId",
        d.name AS "districtName",
        COALESCE(sp.id, sd.id) AS "stateId",
        COALESCE(sp.name, sd.name) AS "stateName",
        b.ward_id AS "wardId",
        w.name AS "wardName",
        w.ward_number AS "wardNumber",
        b.booth_number AS "boothNumber", 
        b.name, 
        b.location_building AS "locationBuilding", 
        b.total_voters AS "totalVoters", 
        b.created_at AS "createdAt", 
        b.updated_at AS "updatedAt" 
      FROM booths b
      LEFT JOIN assembly_constituencies a ON b.ac_id = a.id
      LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
      LEFT JOIN states sp ON p.state_id = sp.id
      LEFT JOIN districts d ON a.district_id = d.id
      LEFT JOIN states sd ON d.state_id = sd.id
      LEFT JOIN wards w ON b.ward_id = w.id
      ${whereClause}
      ORDER BY b.booth_number ASC
    `;

    const res = await query(sql, params);
    return res.rows;
  }

  static async createBooth(data: { acId: string; wardId?: string; boothNumber: number; name: string; locationBuilding?: string; totalVoters?: number }): Promise<Booth> {
    const res = await query(
      `INSERT INTO booths (ac_id, ward_id, booth_number, name, location_building, total_voters) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, ac_id AS "acId", ward_id AS "wardId", booth_number AS "boothNumber", name, location_building AS "locationBuilding", total_voters AS "totalVoters", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [data.acId, data.wardId || null, data.boothNumber, data.name, data.locationBuilding || null, data.totalVoters || 0]
    );
    return res.rows[0];
  }

  static async updateBooth(id: string, data: { acId?: string; wardId?: string; boothNumber?: number; name?: string; locationBuilding?: string; totalVoters?: number }): Promise<Booth | null> {
    const res = await query(
      `UPDATE booths 
       SET ac_id = COALESCE($2, ac_id), 
           ward_id = COALESCE($3, ward_id), 
           booth_number = COALESCE($4, booth_number), 
           name = COALESCE($5, name), 
           location_building = COALESCE($6, location_building), 
           total_voters = COALESCE($7, total_voters), 
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, ac_id AS "acId", ward_id AS "wardId", booth_number AS "boothNumber", name, location_building AS "locationBuilding", total_voters AS "totalVoters", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, data.acId || null, data.wardId || null, data.boothNumber || null, data.name || null, data.locationBuilding || null, data.totalVoters || null]
    );
    return res.rows[0] || null;
  }

  static async deleteBooth(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM booths WHERE id = $1 RETURNING id`, [id]);
    return (res.rowCount || 0) > 0;
  }


  // --- CASTES UPDATE & DELETE ---
  static async updateCaste(id: string, name?: string, category?: string, religionId?: string, parentCasteId?: string): Promise<Caste | null> {
    const res = await query(
      `UPDATE castes 
       SET name = COALESCE($2, name), 
           category = COALESCE($3, category), 
           religion_id = COALESCE($4, religion_id),
           parent_caste_id = COALESCE($5, parent_caste_id),
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, category, religion_id AS "religionId", parent_caste_id AS "parentCasteId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name || null, category || null, religionId || null, parentCasteId || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:castes*');
    return res.rows[0] || null;
  }

  static async deleteCaste(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM castes WHERE id = $1 RETURNING id`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:castes*');
    return (res.rowCount || 0) > 0;
  }

  // --- STATES UPDATE & DELETE ---
  static async updateState(id: string, name?: string, code?: string): Promise<State | null> {
    const res = await query(
      `UPDATE states 
       SET name = COALESCE($2, name), 
           code = COALESCE($3, code),
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, code, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name || null, code || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:states*');
    return res.rows[0] || null;
  }

  static async deleteState(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM states WHERE id = $1 RETURNING id`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:states*');
    return (res.rowCount || 0) > 0;
  }

  // --- DISTRICTS UPDATE & DELETE ---
  static async updateDistrict(id: string, name?: string, stateId?: string): Promise<District | null> {
    const res = await query(
      `UPDATE districts 
       SET name = COALESCE($2, name), 
           state_id = COALESCE($3, state_id),
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, state_id AS "stateId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name || null, stateId || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:districts*');
    return res.rows[0] || null;
  }

  static async deleteDistrict(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM districts WHERE id = $1 RETURNING id`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:districts*');
    return (res.rowCount || 0) > 0;
  }

  // --- PARLIAMENTARY CONSTITUENCIES (PC) UPDATE & DELETE ---
  static async updatePc(id: string, name?: string, pcNumber?: number, stateId?: string): Promise<ParliamentaryConstituency | null> {
    const res = await query(
      `UPDATE parliamentary_constituencies 
       SET name = COALESCE($2, name), 
           pc_number = COALESCE($3, pc_number),
           state_id = COALESCE($4, state_id),
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, state_id AS "stateId", pc_number AS "pcNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name || null, pcNumber || null, stateId || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:pcs*');
    return res.rows[0] || null;
  }

  static async deletePc(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM parliamentary_constituencies WHERE id = $1 RETURNING id`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:pcs*');
    return (res.rowCount || 0) > 0;
  }

  // --- ASSEMBLY CONSTITUENCIES (AC) UPDATE & DELETE ---
  static async updateAc(id: string, name?: string, acNumber?: number, pcId?: string, districtId?: string): Promise<AssemblyConstituency | null> {
    const res = await query(
      `UPDATE assembly_constituencies 
       SET name = COALESCE($2, name), 
           ac_number = COALESCE($3, ac_number),
           pc_id = COALESCE($4, pc_id),
           district_id = COALESCE($5, district_id),
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, pc_id AS "pcId", district_id AS "districtId", ac_number AS "acNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name || null, acNumber || null, pcId || null, districtId || null]
    );
    await CacheService.invalidatePattern('ranniti:masters:acs*');
    return res.rows[0] || null;
  }

  static async deleteAc(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM assembly_constituencies WHERE id = $1 RETURNING id`, [id]);
    await CacheService.invalidatePattern('ranniti:masters:acs*');
    return (res.rowCount || 0) > 0;
  }
}
