import { query } from './dbPool';
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
    const res = await query(
      `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" 
       FROM religions 
       ORDER BY name ASC`
    );
    return res.rows;
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
    return res.rows[0] || null;
  }

  static async deleteReligion(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM religions WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --- CASTES ---
  static async getCastes(): Promise<Caste[]> {
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
  }

  static async createCaste(name: string, category: string, religionId?: string, parentCasteId?: string): Promise<Caste> {
    const res = await query(
      `INSERT INTO castes (name, category, religion_id, parent_caste_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, category, religion_id AS "religionId", parent_caste_id AS "parentCasteId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, category, religionId || null, parentCasteId || null]
    );
    return res.rows[0];
  }

  // --- STATES ---
  static async getStates(): Promise<State[]> {
    const res = await query(
      `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" 
       FROM states 
       ORDER BY name ASC`
    );
    return res.rows;
  }

  static async createState(name: string): Promise<State> {
    const res = await query(
      `INSERT INTO states (name) 
       VALUES ($1) 
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name]
    );
    return res.rows[0];
  }

  // --- DISTRICTS ---
  static async getDistricts(stateId?: string): Promise<District[]> {
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
  }

  static async createDistrict(stateId: string, name: string): Promise<District> {
    const res = await query(
      `INSERT INTO districts (state_id, name) 
       VALUES ($1, $2) 
       RETURNING id, state_id AS "stateId", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [stateId, name]
    );
    return res.rows[0];
  }

  // --- TALUKAS ---
  static async getTalukas(districtId?: string, stateId?: string): Promise<Taluka[]> {
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
    return res.rows[0] || null;
  }

  static async deleteTaluka(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM talukas WHERE id = $1`, [id]);
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
  static async getVillages(talukaId?: string, districtId?: string, stateId?: string): Promise<Village[]> {
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
    return res.rows[0] || null;
  }

  static async deleteVillage(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM villages WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --- PARLIAMENTARY CONSTITUENCIES (PC) ---
  static async getPcs(stateId?: string): Promise<ParliamentaryConstituency[]> {
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
  }

  static async createPc(stateId: string, pcNumber: number, name: string): Promise<ParliamentaryConstituency> {
    const res = await query(
      `INSERT INTO parliamentary_constituencies (state_id, pc_number, name) 
       VALUES ($1, $2, $3) 
       RETURNING id, state_id AS "stateId", pc_number AS "pcNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [stateId, pcNumber, name]
    );
    return res.rows[0];
  }

  // --- ASSEMBLY CONSTITUENCIES (AC) ---
  static async getAcs(pcId?: string, districtId?: string, stateId?: string): Promise<AssemblyConstituency[]> {
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
  }

  static async createAc(pcId: string, acNumber: number, name: string, districtId?: string): Promise<AssemblyConstituency> {
    const res = await query(
      `INSERT INTO assembly_constituencies (pc_id, ac_number, name, district_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, pc_id AS "pcId", district_id AS "districtId", ac_number AS "acNumber", name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [pcId, acNumber, name, districtId || null]
    );
    return res.rows[0];
  }

  // --- PARTIES ---
  static async getParties(): Promise<Party[]> {
    const res = await query(
      `SELECT id, name, abbreviation, symbol_logo AS "symbolLogo", alliance, created_at AS "createdAt", updated_at AS "updatedAt" 
       FROM parties 
       ORDER BY name ASC`
    );
    return res.rows;
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
    return res.rows[0] || null;
  }

  static async deleteParty(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM parties WHERE id = $1 RETURNING id`, [id]);
    return (res.rowCount || 0) > 0;
  }

  // --- WARDS ---
  static async getWards(acId?: string): Promise<Ward[]> {
    const params: any[] = [];
    let whereClause = '';

    if (acId) {
      params.push(acId);
      whereClause = `WHERE w.ac_id = $1`;
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
  static async getBooths(acId?: string, wardId?: string): Promise<Booth[]> {
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
    return res.rows[0] || null;
  }

  static async deleteCaste(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM castes WHERE id = $1 RETURNING id`, [id]);
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
    return res.rows[0] || null;
  }

  static async deleteState(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM states WHERE id = $1 RETURNING id`, [id]);
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
    return res.rows[0] || null;
  }

  static async deleteDistrict(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM districts WHERE id = $1 RETURNING id`, [id]);
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
    return res.rows[0] || null;
  }

  static async deletePc(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM parliamentary_constituencies WHERE id = $1 RETURNING id`, [id]);
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
    return res.rows[0] || null;
  }

  static async deleteAc(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM assembly_constituencies WHERE id = $1 RETURNING id`, [id]);
    return (res.rowCount || 0) > 0;
  }
}
