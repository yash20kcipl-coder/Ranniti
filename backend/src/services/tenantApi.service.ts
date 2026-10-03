import { query as mainQuery } from '../queries/dbPool';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

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
}

export class TenantApiService {
  /**
   * Helper: Get tenant user profile & assigned AC IDs
   */
  private async getAssignedAcIds(userId: string): Promise<string[]> {
    const res = await mainQuery(
      `SELECT t.ac_ids FROM admin_users u
       LEFT JOIN tenant_assignments t ON t.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    return res.rows[0]?.ac_ids || [];
  }

  // --- ASSEMBLY CONSTITUENCIES (ACs) ---
  async getTenantAcs(userId: string) {
    const acIds = await this.getAssignedAcIds(userId);
    if (acIds.length === 0) {
      // Fallback: return all ACs if no specific filter assigned
      const allRes = await mainQuery(
        `SELECT a.id, a.name, a.ac_number as "acNumber", a.pc_id as "pcId", a.district_id as "districtId",
                pc.name as "pcName", d.name as "districtName"
         FROM assembly_constituencies a
         LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
         LEFT JOIN districts d ON d.id = a.district_id
         ORDER BY a.ac_number ASC`
      );
      return allRes.rows;
    }

    const res = await mainQuery(
      `SELECT a.id, a.name, a.ac_number as "acNumber", a.pc_id as "pcId", a.district_id as "districtId",
              pc.name as "pcName", d.name as "districtName"
       FROM assembly_constituencies a
       LEFT JOIN parliamentary_constituencies pc ON pc.id = a.pc_id
       LEFT JOIN districts d ON d.id = a.district_id
       WHERE a.id = ANY($1::uuid[])
       ORDER BY a.ac_number ASC`,
      [acIds]
    );
    return res.rows;
  }

  async createTenantAc(userId: string, input: CreateAcInput) {
    const { pcId, districtId, acNumber, name } = input;
    if (!pcId || !acNumber || !name) {
      throw ApiError.badRequest('pcId, acNumber, and name are required');
    }

    const insertRes = await mainQuery(
      `INSERT INTO assembly_constituencies (pc_id, district_id, ac_number, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, ac_number as "acNumber", pc_id as "pcId", district_id as "districtId"`,
      [pcId, districtId || null, acNumber, name]
    );

    const newAc = insertRes.rows[0];

    // Link newly created AC to tenant_assignments.ac_ids for this user
    await mainQuery(
      `UPDATE tenant_assignments
       SET ac_ids = array_append(COALESCE(ac_ids, '{}'), $1::uuid), updated_at = NOW()
       WHERE user_id = $2 AND NOT ($1::uuid = ANY(COALESCE(ac_ids, '{}')))`,
      [newAc.id, userId]
    );

    return newAc;
  }

  // --- WARDS ---
  async getTenantWards(userId: string, acId?: string) {
    const acIds = await this.getAssignedAcIds(userId);
    let queryStr = `
      SELECT w.id, w.ac_id as "acId", w.ward_number as "wardNumber", w.name,
             a.name as "acName"
      FROM wards w
      LEFT JOIN assembly_constituencies a ON a.id = w.ac_id
    `;
    const params: any[] = [];

    if (acId) {
      params.push(acId);
      queryStr += ` WHERE w.ac_id = $1`;
    } else if (acIds.length > 0) {
      params.push(acIds);
      queryStr += ` WHERE w.ac_id = ANY($1::uuid[])`;
    }

    queryStr += ` ORDER BY w.ward_number ASC`;
    const res = await mainQuery(queryStr, params);
    return res.rows;
  }

  async createTenantWard(input: CreateWardInput) {
    const { acId, wardNumber, name } = input;
    if (!acId || !wardNumber || !name) {
      throw ApiError.badRequest('acId, wardNumber, and name are required');
    }

    const res = await mainQuery(
      `INSERT INTO wards (ac_id, ward_number, name)
       VALUES ($1, $2, $3)
       RETURNING id, ac_id as "acId", ward_number as "wardNumber", name`,
      [acId, wardNumber, name]
    );
    return res.rows[0];
  }

  // --- BOOTHS ---
  async getTenantBooths(userId: string, acId?: string, wardId?: string) {
    // 1. Fetch booths assigned directly via user_booth_assignments
    const userBoothsRes = await mainQuery(
      `SELECT b.id, b.ac_id as "acId", b.ward_id as "wardId", b.village_id as "villageId",
              b.booth_number as "boothNumber", b.name, b.location_building as "locationBuilding",
              b.total_voters as "totalVoters", a.name as "acName", w.name as "wardName"
       FROM user_booth_assignments uba
       JOIN booths b ON b.id = uba.booth_id
       LEFT JOIN assembly_constituencies a ON a.id = b.ac_id
       LEFT JOIN wards w ON w.id = b.ward_id
       WHERE uba.user_id = $1
       ORDER BY b.booth_number ASC`,
      [userId]
    );

    if (userBoothsRes.rows.length > 0) {
      return userBoothsRes.rows;
    }

    // 2. Fallback to booths under assigned ACs
    const acIds = await this.getAssignedAcIds(userId);
    let queryStr = `
      SELECT b.id, b.ac_id as "acId", b.ward_id as "wardId", b.village_id as "villageId",
             b.booth_number as "boothNumber", b.name, b.location_building as "locationBuilding",
             b.total_voters as "totalVoters", a.name as "acName", w.name as "wardName"
      FROM booths b
      LEFT JOIN assembly_constituencies a ON a.id = b.ac_id
      LEFT JOIN wards w ON w.id = b.ward_id
    `;
    const params: any[] = [];

    const conditions: string[] = [];
    if (acId) {
      params.push(acId);
      conditions.push(`b.ac_id = $${params.length}`);
    } else if (acIds.length > 0) {
      params.push(acIds);
      conditions.push(`b.ac_id = ANY($${params.length}::uuid[])`);
    }

    if (wardId) {
      params.push(wardId);
      conditions.push(`b.ward_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryStr += ` WHERE ` + conditions.join(' AND ');
    }

    queryStr += ` ORDER BY b.booth_number ASC`;
    const res = await mainQuery(queryStr, params);
    return res.rows;
  }

  async createTenantBooth(userId: string, input: CreateBoothInput) {
    const { acId, wardId, villageId, boothNumber, name, locationBuilding } = input;
    if (!acId || !boothNumber || !name) {
      throw ApiError.badRequest('acId, boothNumber, and name are required');
    }

    const insertRes = await mainQuery(
      `INSERT INTO booths (ac_id, ward_id, village_id, booth_number, name, location_building)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, ac_id as "acId", ward_id as "wardId", village_id as "villageId", booth_number as "boothNumber", name, location_building as "locationBuilding"`,
      [acId, wardId || null, villageId || null, boothNumber, name, locationBuilding || null]
    );

    const newBooth = insertRes.rows[0];

    // Assign new booth to current tenant user
    await mainQuery(
      `INSERT INTO user_booth_assignments (user_id, booth_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, booth_id) DO NOTHING`,
      [userId, newBooth.id]
    );

    return newBooth;
  }

  // --- GEOGRAPHY (STATES, DISTRICTS, TALUKAS, VILLAGES) ---
  async getTenantStates() {
    const res = await mainQuery(`SELECT id, name FROM states ORDER BY name ASC`);
    return res.rows;
  }

  async getTenantDistricts(stateId?: string) {
    if (stateId) {
      const res = await mainQuery(
        `SELECT id, state_id as "stateId", name FROM districts WHERE state_id = $1 ORDER BY name ASC`,
        [stateId]
      );
      return res.rows;
    }
    const res = await mainQuery(`SELECT id, state_id as "stateId", name FROM districts ORDER BY name ASC`);
    return res.rows;
  }

  async getTenantTalukas(districtId?: string) {
    if (districtId) {
      const res = await mainQuery(
        `SELECT id, district_id as "districtId", name FROM talukas WHERE district_id = $1 ORDER BY name ASC`,
        [districtId]
      );
      return res.rows;
    }
    const res = await mainQuery(`SELECT id, district_id as "districtId", name FROM talukas ORDER BY name ASC`);
    return res.rows;
  }

  async createTenantTaluka(input: CreateTalukaInput) {
    const { districtId, name } = input;
    if (!districtId || !name) {
      throw ApiError.badRequest('districtId and name are required');
    }

    const res = await mainQuery(
      `INSERT INTO talukas (district_id, name)
       VALUES ($1, $2)
       RETURNING id, district_id as "districtId", name`,
      [districtId, name]
    );
    return res.rows[0];
  }

  async getTenantVillages(talukaId?: string) {
    if (talukaId) {
      const res = await mainQuery(
        `SELECT id, taluka_id as "talukaId", name FROM villages WHERE taluka_id = $1 ORDER BY name ASC`,
        [talukaId]
      );
      return res.rows;
    }
    const res = await mainQuery(`SELECT id, taluka_id as "talukaId", name FROM villages ORDER BY name ASC`);
    return res.rows;
  }

  async createTenantVillage(input: CreateVillageInput) {
    const { talukaId, name } = input;
    if (!talukaId || !name) {
      throw ApiError.badRequest('talukaId and name are required');
    }

    const res = await mainQuery(
      `INSERT INTO villages (taluka_id, name)
       VALUES ($1, $2)
       RETURNING id, taluka_id as "talukaId", name`,
      [talukaId, name]
    );
    return res.rows[0];
  }

  // --- REFERENCE MASTER DATA (RELIGIONS, CASTES, PARTIES) ---
  async getTenantReligions() {
    const res = await mainQuery(`SELECT id, name FROM religions ORDER BY name ASC`);
    return res.rows;
  }

  async getTenantCastes(religionId?: string) {
    let queryStr = `SELECT id, name, category, religion_id as "religionId", parent_caste_id as "parentCasteId" FROM castes`;
    const params: any[] = [];
    if (religionId) {
      params.push(religionId);
      queryStr += ` WHERE religion_id = $1`;
    }
    queryStr += ` ORDER BY name ASC`;
    const res = await mainQuery(queryStr, params);
    return res.rows;
  }

  async createTenantCaste(input: CreateCasteInput) {
    const { name, category, religionId, parentCasteId } = input;
    if (!name || !category) {
      throw ApiError.badRequest('name and category are required');
    }

    const res = await mainQuery(
      `INSERT INTO castes (name, category, religion_id, parent_caste_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, category, religion_id as "religionId", parent_caste_id as "parentCasteId"`,
      [name, category, religionId || null, parentCasteId || null]
    );
    return res.rows[0];
  }

  async getTenantParties() {
    const res = await mainQuery(
      `SELECT id, name, abbreviation, symbol_logo as "symbolLogo", alliance FROM parties ORDER BY name ASC`
    );
    return res.rows;
  }

  async createTenantParty(input: CreatePartyInput) {
    const { name, abbreviation, symbolLogo, alliance } = input;
    if (!name || !abbreviation) {
      throw ApiError.badRequest('name and abbreviation are required');
    }

    const res = await mainQuery(
      `INSERT INTO parties (name, abbreviation, symbol_logo, alliance)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, abbreviation, symbol_logo as "symbolLogo", alliance`,
      [name, abbreviation, symbolLogo || null, alliance || null]
    );
    return res.rows[0];
  }

  // --- VOTERS ---
  async getTenantVoters(userId: string, filters: { page?: number; limit?: number; search?: string; boothId?: string; acId?: string }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const acIds = await this.getAssignedAcIds(userId);

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

    const countRes = await mainQuery(`SELECT COUNT(*)::int as total FROM voters v ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    params.push(limit, offset);
    const queryStr = `
      SELECT v.id, v.epic_no as "epicNo", v.voter_name as "voterName", v.gender, v.age,
             v.mobile_number as "mobileNumber", v.address, v.ac_id as "acId", v.booth_id as "boothId",
             b.name as "boothName", a.name as "acName"
      FROM voters v
      LEFT JOIN booths b ON b.id = v.booth_id
      LEFT JOIN assembly_constituencies a ON a.id = v.ac_id
      ${whereClause}
      ORDER BY v.voter_name ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const dataRes = await mainQuery(queryStr, params);

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
