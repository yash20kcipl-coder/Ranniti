import { logger } from '../utils/logger';
import { query } from '../queries/dbPool';
import { CacheService } from '../services/cache.service';

export interface VoterResolvedMasters {
  states: Map<string, string>;
  pcs: Map<string, string>;
  districts: Map<string, string>;
  acs: Map<string, string>;
  wards: Map<string, string>;
  booths: Map<string, any>;
  religions: Map<string, string>;
  castes: Map<string, string>;
  parties: Map<string, string>;
}

/**
 * Ultra-Fast & Well-Optimized Lookup Resolver Service
 * High-performance batch resolution & auto-creation for ALL master lookup entities.
 * Uses single-query bulk SQL inserts, in-memory Map caching, and O(1) Set deduplication.
 */
export class LookupResolverService {
  /**
   * Safely extracts a trimmed string value using canonical and case-insensitive aliases.
   */
  static extractValue(row: Record<string, any>, aliases: string[]): string {
    if (!row || typeof row !== 'object') return '';
    for (const key of aliases) {
      const val = row[key];
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        return String(val).trim();
      }
    }
    return '';
  }

  /**
   * Normalizes composite lookup keys (e.g. parentId_childName).
   */
  static compositeKey(parentId: string | undefined | null, name: string): string {
    const cleanParent = (parentId || '').toLowerCase().trim();
    const cleanName = (name || '').toLowerCase().trim();
    return cleanParent ? `${cleanParent}_${cleanName}` : cleanName;
  }

  /**
   * Batch resolve and auto-create missing religions in a single query.
   * Returns normalized Map<lowercase_name_or_uuid, uuid>.
   */
  static async ensureReligionsExist(records: any[], keyNames = ['religionName', 'religion', 'religionId', 'religion_id']): Promise<Map<string, string>> {
    const religionMap = new Map<string, string>();

    const dbReligions = await query(`SELECT id, name FROM religions`);
    for (const r of dbReligions.rows) {
      const uuid = r.id;
      const cleanName = r.name.toLowerCase().trim();
      religionMap.set(uuid.toLowerCase(), uuid);
      religionMap.set(cleanName, uuid);
    }

    const missingNames = new Set<string>();
    for (const row of records) {
      for (const key of keyNames) {
        const val = row[key];
        if (val && typeof val === 'string' && val.trim().length > 0) {
          const cleanVal = val.trim();
          if (!religionMap.has(cleanVal.toLowerCase())) {
            missingNames.add(cleanVal);
          }
          break;
        }
      }
    }

    if (missingNames.size === 0) return religionMap;

    const missingList = Array.from(missingNames);
    const valuePlaceholders = missingList.map((_, idx) => `($${idx + 1})`).join(', ');
    const bulkInsertSql = `
      INSERT INTO religions (name)
      VALUES ${valuePlaceholders}
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id, name;
    `;

    const insertedRes = await query(bulkInsertSql, missingList);
    for (const r of insertedRes.rows) {
      const uuid = r.id;
      const cleanName = r.name.toLowerCase().trim();
      religionMap.set(uuid.toLowerCase(), uuid);
      religionMap.set(cleanName, uuid);
      logger.info(`[LookupResolverService] Auto-created missing religion: '${r.name}' (${uuid})`);
    }

    await CacheService.invalidatePattern('ranniti:masters:religions*');
    return religionMap;
  }

  /**
   * Batch resolve and auto-create missing castes/parent castes in single batch queries.
   * Returns normalized Map<lowercase_caste_name_or_uuid, caste_uuid>.
   */
  static async ensureCastesExist(
    records: any[],
    religionMap?: Map<string, string>,
    casteKeys = ['casteName', 'caste', 'parentCasteName', 'parent_caste_name', 'casteId', 'caste_id']
  ): Promise<Map<string, string>> {
    const casteMap = new Map<string, string>();

    const dbCastes = await query(`SELECT id, name FROM castes`);
    for (const c of dbCastes.rows) {
      const uuid = c.id;
      const cleanName = c.name.toLowerCase().trim();
      casteMap.set(uuid.toLowerCase(), uuid);
      casteMap.set(cleanName, uuid);
    }

    const missingCasteEntries: { name: string; category: string; religionId: string | null }[] = [];
    const seenNames = new Set<string>();

    for (const row of records) {
      let category = (row.category || 'General').trim();
      let religionId: string | null = null;

      if (religionMap) {
        const relRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
        religionId = religionMap.get(relRef) || null;
      }

      for (const key of casteKeys) {
        const val = row[key];
        if (val && typeof val === 'string' && val.trim().length > 0) {
          const cleanVal = val.trim();
          const cleanLower = cleanVal.toLowerCase();
          if (!casteMap.has(cleanLower) && !seenNames.has(cleanLower)) {
            seenNames.add(cleanLower);
            missingCasteEntries.push({ name: cleanVal, category, religionId });
          }
        }
      }
    }

    if (missingCasteEntries.length === 0) return casteMap;

    const paramValues: any[] = [];
    const valueTuples: string[] = [];

    missingCasteEntries.forEach((entry, idx) => {
      const offset = idx * 3;
      valueTuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      paramValues.push(entry.name, entry.category, entry.religionId);
    });

    const bulkInsertSql = `
      INSERT INTO castes (name, category, religion_id)
      VALUES ${valueTuples.join(', ')}
      ON CONFLICT (name) DO UPDATE SET
        category = EXCLUDED.category,
        religion_id = COALESCE(EXCLUDED.religion_id, castes.religion_id),
        updated_at = NOW()
      RETURNING id, name;
    `;

    const insertedRes = await query(bulkInsertSql, paramValues);
    for (const c of insertedRes.rows) {
      const uuid = c.id;
      const cleanName = c.name.toLowerCase().trim();
      casteMap.set(uuid.toLowerCase(), uuid);
      casteMap.set(cleanName, uuid);
      logger.info(`[LookupResolverService] Auto-created missing caste: '${c.name}' (${uuid})`);
    }

    await CacheService.invalidatePattern('ranniti:masters:castes*');
    return casteMap;
  }

  /**
   * Batch resolve and auto-create missing States.
   * Returns normalized Map<lowercase_state_name_or_code_or_uuid, state_uuid>.
   */
  static async ensureStatesExist(records: any[], stateKeys = ['stateName', 'state', 'State Name', 'StateName', 'stateCode', 'state_code']): Promise<Map<string, string>> {
    const stateMap = new Map<string, string>();
    const dbStates = await query(`SELECT id, name FROM states`);
    for (const s of dbStates.rows) {
      const uuid = s.id;
      stateMap.set(uuid.toLowerCase(), uuid);
      stateMap.set(s.name.toLowerCase().trim(), uuid);
    }

    const missingNames = new Set<string>();
    for (const row of records) {
      for (const key of stateKeys) {
        const val = row[key];
        if (val && typeof val === 'string' && val.trim().length > 0) {
          const cleanVal = val.trim();
          if (!stateMap.has(cleanVal.toLowerCase())) {
            missingNames.add(cleanVal);
          }
          break;
        }
      }
    }

    if (missingNames.size === 0) return stateMap;

    const missingList = Array.from(missingNames);
    const valuePlaceholders = missingList.map((_, idx) => `($${idx + 1})`).join(', ');
    const bulkInsertSql = `
      INSERT INTO states (name)
      VALUES ${valuePlaceholders}
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id, name;
    `;

    const insertedRes = await query(bulkInsertSql, missingList);
    for (const s of insertedRes.rows) {
      const uuid = s.id;
      const cleanName = s.name.toLowerCase().trim();
      stateMap.set(uuid.toLowerCase(), uuid);
      stateMap.set(cleanName, uuid);
      logger.info(`[LookupResolverService] Auto-created missing state: '${s.name}' (${uuid})`);
    }

    await CacheService.invalidatePattern('ranniti:masters:states*');
    return stateMap;
  }

  /**
   * Batch resolve and auto-create missing Political Parties.
   * Returns normalized Map<lowercase_party_name_or_abbr_or_uuid, party_uuid>.
   */
  static async ensurePartiesExist(records: any[], partyKeys = ['partyName', 'party', 'Party Name', 'PartyName', 'alliance', 'partyId', 'party_id']): Promise<Map<string, string>> {
    const partyMap = new Map<string, string>();
    const dbParties = await query(`SELECT id, name, abbreviation FROM parties`);
    for (const p of dbParties.rows) {
      const uuid = p.id;
      partyMap.set(uuid.toLowerCase(), uuid);
      partyMap.set(p.name.toLowerCase().trim(), uuid);
      if (p.abbreviation) partyMap.set(p.abbreviation.toLowerCase().trim(), uuid);
    }

    const missingNames = new Set<string>();
    for (const row of records) {
      for (const key of partyKeys) {
        const val = row[key];
        if (val && typeof val === 'string' && val.trim().length > 0) {
          const cleanVal = val.trim();
          if (!partyMap.has(cleanVal.toLowerCase())) {
            missingNames.add(cleanVal);
          }
          break;
        }
      }
    }

    if (missingNames.size === 0) return partyMap;

    const missingList = Array.from(missingNames);
    const paramValues: any[] = [];
    const valueTuples: string[] = [];

    missingList.forEach((name, idx) => {
      const offset = idx * 2;
      const abbr = name.length <= 10 ? name.toUpperCase() : name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().substring(0, 10);
      valueTuples.push(`($${offset + 1}, $${offset + 2})`);
      paramValues.push(name, abbr);
    });

    const bulkInsertSql = `
      INSERT INTO parties (name, abbreviation)
      VALUES ${valueTuples.join(', ')}
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id, name, abbreviation;
    `;

    const insertedRes = await query(bulkInsertSql, paramValues);
    for (const p of insertedRes.rows) {
      const uuid = p.id;
      partyMap.set(uuid.toLowerCase(), uuid);
      partyMap.set(p.name.toLowerCase().trim(), uuid);
      if (p.abbreviation) partyMap.set(p.abbreviation.toLowerCase().trim(), uuid);
      logger.info(`[LookupResolverService] Auto-created missing party: '${p.name}' (${uuid})`);
    }

    await CacheService.invalidatePattern('ranniti:masters:parties*');
    return partyMap;
  }

  /**
   * Batch resolve and auto-create missing Districts.
   * Returns normalized Map<key, district_uuid>.
   */
  static async ensureDistrictsExist(
    records: any[],
    stateMap?: Map<string, string>,
    districtKeys = ['District Name', 'DistrictName', 'districtName', 'district', 'districtId', 'district_id'],
    defaultStateId?: string
  ): Promise<Map<string, string>> {
    const districtMap = new Map<string, string>();

    const dbDistricts = await query(`
      SELECT d.id, d.state_id, d.name, s.name AS state_name
      FROM districts d
      LEFT JOIN states s ON d.state_id = s.id
    `);

    for (const d of dbDistricts.rows) {
      const uuid = d.id;
      const cleanName = d.name.toLowerCase().trim();
      districtMap.set(uuid.toLowerCase(), uuid);
      districtMap.set(cleanName, uuid);
      if (d.state_id) {
        districtMap.set(`${d.state_id}_${cleanName}`, uuid);
      }
      if (d.state_name) {
        districtMap.set(`${d.state_name.toLowerCase().trim()}_${cleanName}`, uuid);
      }
    }

    const missingEntriesMap = new Map<string, { stateId: string; name: string }>();

    for (const row of records) {
      const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
      const stateId = (stateMap ? stateMap.get(stateRef) || null : null) || defaultStateId || null;

      for (const key of districtKeys) {
        const val = row[key];
        if (val && typeof val === 'string' && val.trim().length > 0) {
          const cleanVal = val.trim();
          const cleanLower = cleanVal.toLowerCase();
          const comboKey = stateId ? `${stateId}_${cleanLower}` : (stateRef ? `${stateRef}_${cleanLower}` : cleanLower);

          if (!districtMap.has(comboKey) && !districtMap.has(cleanLower) && stateId) {
            const entryKey = `${stateId}_${cleanLower}`;
            if (!missingEntriesMap.has(entryKey)) {
              missingEntriesMap.set(entryKey, { stateId, name: cleanVal });
            }
          }
          break;
        }
      }
    }

    const missingEntries = Array.from(missingEntriesMap.values());
    if (missingEntries.length === 0) return districtMap;

    const paramValues: any[] = [];
    const valueTuples: string[] = [];

    missingEntries.forEach((entry, idx) => {
      const offset = idx * 2;
      valueTuples.push(`($${offset + 1}, $${offset + 2})`);
      paramValues.push(entry.stateId, entry.name);
    });

    const bulkInsertSql = `
      INSERT INTO districts (state_id, name)
      VALUES ${valueTuples.join(', ')}
      ON CONFLICT (state_id, name) DO UPDATE SET updated_at = NOW()
      RETURNING id, state_id, name;
    `;

    const insertedRes = await query(bulkInsertSql, paramValues);

    const statesRes = await query(`SELECT id, name FROM states`);
    const stateIdToName = new Map<string, string>();
    for (const s of statesRes.rows) {
      stateIdToName.set(s.id, s.name.toLowerCase().trim());
    }

    for (const d of insertedRes.rows) {
      const uuid = d.id;
      const cleanName = d.name.toLowerCase().trim();
      const stateName = stateIdToName.get(d.state_id);
      districtMap.set(uuid.toLowerCase(), uuid);
      districtMap.set(cleanName, uuid);
      if (d.state_id) {
        districtMap.set(`${d.state_id}_${cleanName}`, uuid);
      }
      if (stateName) {
        districtMap.set(`${stateName}_${cleanName}`, uuid);
      }
      logger.info(`[LookupResolverService] Auto-created missing district: '${d.name}' (${uuid})`);
    }

    await CacheService.invalidatePattern('ranniti:masters:districts*');
    return districtMap;
  }

  /**
   * Batch resolve and auto-create missing Parliamentary Constituencies (PCs).
   * Returns normalized Map<key, pc_uuid>.
   */
  static async ensurePcsExist(
    records: any[],
    stateMap?: Map<string, string>,
    pcKeys = ['PC Name', 'PCName', 'pcName', 'pc', 'pcId', 'pc_id']
  ): Promise<Map<string, string>> {
    const pcMap = new Map<string, string>();

    const dbPcs = await query(`
      SELECT p.id, p.state_id, p.pc_number, p.name, s.name AS state_name
      FROM parliamentary_constituencies p
      LEFT JOIN states s ON p.state_id = s.id
    `);

    for (const p of dbPcs.rows) {
      const uuid = p.id;
      const cleanName = p.name.toLowerCase().trim();
      pcMap.set(uuid.toLowerCase(), uuid);
      pcMap.set(cleanName, uuid);
      if (p.state_id) {
        pcMap.set(`${p.state_id}_${cleanName}`, uuid);
      }
      if (p.state_name) {
        pcMap.set(`${p.state_name.toLowerCase().trim()}_${cleanName}`, uuid);
      }
    }

    const maxPcNumByState = new Map<string, number>();
    for (const p of dbPcs.rows) {
      const currentMax = maxPcNumByState.get(p.state_id) || 0;
      if (p.pc_number > currentMax) maxPcNumByState.set(p.state_id, p.pc_number);
    }

    const missingEntriesMap = new Map<string, { stateId: string; pcNumber: number; name: string }>();

    for (const row of records) {
      const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
      const stateId = stateMap ? stateMap.get(stateRef) || null : null;

      let rawPcNum = Number(row['PC Number'] || row.PCNumber || row.pcNumber || row.pc_number || 0);

      for (const key of pcKeys) {
        const val = row[key];
        if (val && typeof val === 'string' && val.trim().length > 0) {
          const cleanVal = val.trim();
          const cleanLower = cleanVal.toLowerCase();
          const comboKey = stateId ? `${stateId}_${cleanLower}` : (stateRef ? `${stateRef}_${cleanLower}` : cleanLower);

          if (!pcMap.has(comboKey) && !pcMap.has(cleanLower) && stateId) {
            const entryKey = `${stateId}_${cleanLower}`;
            if (!missingEntriesMap.has(entryKey)) {
              if (!rawPcNum || rawPcNum <= 0) {
                const nextNum = (maxPcNumByState.get(stateId) || 0) + 1;
                maxPcNumByState.set(stateId, nextNum);
                rawPcNum = nextNum;
              }
              missingEntriesMap.set(entryKey, { stateId, pcNumber: rawPcNum, name: cleanVal });
            }
          }
          break;
        }
      }
    }

    const missingEntries = Array.from(missingEntriesMap.values());
    if (missingEntries.length === 0) return pcMap;

    const paramValues: any[] = [];
    const valueTuples: string[] = [];

    missingEntries.forEach((entry, idx) => {
      const offset = idx * 3;
      valueTuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      paramValues.push(entry.stateId, entry.pcNumber, entry.name);
    });

    const bulkInsertSql = `
      INSERT INTO parliamentary_constituencies (state_id, pc_number, name)
      VALUES ${valueTuples.join(', ')}
      ON CONFLICT (state_id, pc_number) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
      RETURNING id, state_id, pc_number, name;
    `;

    const insertedRes = await query(bulkInsertSql, paramValues);

    const statesRes = await query(`SELECT id, name FROM states`);
    const stateIdToName = new Map<string, string>();
    for (const s of statesRes.rows) {
      stateIdToName.set(s.id, s.name.toLowerCase().trim());
    }

    for (const p of insertedRes.rows) {
      const uuid = p.id;
      const cleanName = p.name.toLowerCase().trim();
      const stateName = stateIdToName.get(p.state_id);
      pcMap.set(uuid.toLowerCase(), uuid);
      pcMap.set(cleanName, uuid);
      if (p.state_id) {
        pcMap.set(`${p.state_id}_${cleanName}`, uuid);
      }
      if (stateName) {
        pcMap.set(`${stateName}_${cleanName}`, uuid);
      }
      logger.info(`[LookupResolverService] Auto-created missing PC: '${p.name}' (${uuid})`);
    }

    await CacheService.invalidatePattern('ranniti:masters:pcs*');
    return pcMap;
  }

  /**
   * Batch resolve and auto-create missing Assembly Constituencies (ACs).
   * Returns normalized Map<key, ac_uuid>.
   */
  static async ensureAcsExist(
    records: any[],
    pcMap?: Map<string, string>,
    districtMap?: Map<string, string>,
    defaultPcId?: string
  ): Promise<Map<string, string>> {
    const acMap = new Map<string, string>();

    const dbAcs = await query(`
      SELECT a.id, a.pc_id, a.ac_number, a.name, a.district_id, p.name AS pc_name
      FROM assembly_constituencies a
      LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
    `);

    for (const a of dbAcs.rows) {
      const uuid = a.id;
      const cleanName = a.name.toLowerCase().trim();
      acMap.set(uuid.toLowerCase(), uuid);
      acMap.set(cleanName, uuid);
      if (a.pc_id) {
        acMap.set(`${a.pc_id}_${cleanName}`, uuid);
        acMap.set(`${a.pc_id}_${a.ac_number}`, uuid);
      }
      if (a.pc_name) {
        acMap.set(`${a.pc_name.toLowerCase().trim()}_${cleanName}`, uuid);
      }
    }

    const maxAcNumByPc = new Map<string, number>();
    for (const a of dbAcs.rows) {
      const currentMax = maxAcNumByPc.get(a.pc_id) || 0;
      if (a.ac_number > currentMax) maxAcNumByPc.set(a.pc_id, a.ac_number);
    }

    const missingEntriesMap = new Map<string, { pcId: string; acNumber: number; name: string; districtId: string | null }>();

    for (const row of records) {
      const pcRef = LookupResolverService.extractValue(row, ['PC Name', 'PCName', 'pcName', 'pc', 'pcId', 'pc_id']).toLowerCase();
      const pcId = (pcMap ? pcMap.get(pcRef) : null) || defaultPcId;

      const acName = LookupResolverService.extractValue(row, ['AC Name', 'ACName', 'acName', 'ac', 'ac_name', 'name']);
      const rawAcNum = Number(LookupResolverService.extractValue(row, ['AC Number', 'ACNumber', 'acNumber', 'ac_number']) || 0);

      const districtRef = LookupResolverService.extractValue(row, ['District Name', 'DistrictName', 'districtName', 'district', 'districtId', 'district_id']).toLowerCase();
      const districtId = districtMap ? districtMap.get(districtRef) || null : null;

      if (acName && pcId) {
        const cleanLower = acName.toLowerCase();
        const comboKey = `${pcId}_${cleanLower}`;

        if (!acMap.has(comboKey) && !acMap.has(cleanLower)) {
          if (!missingEntriesMap.has(comboKey)) {
            let acNum = rawAcNum;
            if (!acNum || acNum <= 0) {
              const nextNum = (maxAcNumByPc.get(pcId) || 0) + 1;
              maxAcNumByPc.set(pcId, nextNum);
              acNum = nextNum;
            }
            missingEntriesMap.set(comboKey, { pcId, acNumber: acNum, name: acName, districtId });
          }
        }
      }
    }

    const missingEntries = Array.from(missingEntriesMap.values());
    if (missingEntries.length > 0) {
      const paramValues: any[] = [];
      const valueTuples: string[] = [];

      missingEntries.forEach((entry, idx) => {
        const offset = idx * 4;
        valueTuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
        paramValues.push(entry.pcId, entry.acNumber, entry.name, entry.districtId);
      });

      const bulkInsertSql = `
        INSERT INTO assembly_constituencies (pc_id, ac_number, name, district_id)
        VALUES ${valueTuples.join(', ')}
        ON CONFLICT (pc_id, ac_number) DO UPDATE SET
          name = EXCLUDED.name,
          district_id = COALESCE(EXCLUDED.district_id, assembly_constituencies.district_id),
          updated_at = NOW()
        RETURNING id, pc_id, ac_number, name, district_id;
      `;

      const insertedRes = await query(bulkInsertSql, paramValues);
      for (const a of insertedRes.rows) {
        const uuid = a.id;
        const cleanName = a.name.toLowerCase().trim();
        acMap.set(uuid.toLowerCase(), uuid);
        acMap.set(cleanName, uuid);
        acMap.set(`${a.pc_id}_${cleanName}`, uuid);
        acMap.set(`${a.pc_id}_${a.ac_number}`, uuid);
        logger.info(`[LookupResolverService] Auto-created missing AC: '${a.name}' (${uuid})`);
      }

      await CacheService.invalidatePattern('ranniti:masters:acs*');
    }

    return acMap;
  }

  /**
   * Batch resolve and auto-create missing Talukas / Tehsils.
   * Returns normalized Map<key, taluka_uuid>.
   */
  static async ensureTalukasExist(
    records: any[],
    districtMap?: Map<string, string>,
    defaultDistrictId?: string
  ): Promise<Map<string, string>> {
    const talukaMap = new Map<string, string>();

    const dbTalukas = await query(`
      SELECT t.id, t.district_id, t.name, d.name AS district_name
      FROM talukas t
      LEFT JOIN districts d ON t.district_id = d.id
    `);

    for (const t of dbTalukas.rows) {
      const uuid = t.id;
      const cleanName = t.name.toLowerCase().trim();
      talukaMap.set(uuid.toLowerCase(), uuid);
      talukaMap.set(cleanName, uuid);
      if (t.district_id) {
        talukaMap.set(`${t.district_id}_${cleanName}`, uuid);
      }
      if (t.district_name) {
        talukaMap.set(`${t.district_name.toLowerCase().trim()}_${cleanName}`, uuid);
      }
    }

    const missingEntriesMap = new Map<string, { districtId: string; name: string }>();

    for (const row of records) {
      const distRef = LookupResolverService.extractValue(row, ['District Name', 'DistrictName', 'districtName', 'district', 'districtId', 'district_id']).toLowerCase();
      const districtId = (districtMap ? districtMap.get(distRef) : null) || defaultDistrictId;

      const talukaName = LookupResolverService.extractValue(row, ['Taluka Name', 'TalukaName', 'talukaName', 'taluka', 'Tehsil', 'tehsil', 'name']);
      if (talukaName && districtId) {
        const cleanLower = talukaName.toLowerCase();
        const comboKey = `${districtId}_${cleanLower}`;

        if (!talukaMap.has(comboKey) && !talukaMap.has(cleanLower)) {
          if (!missingEntriesMap.has(comboKey)) {
            missingEntriesMap.set(comboKey, { districtId, name: talukaName });
          }
        }
      }
    }

    const missingEntries = Array.from(missingEntriesMap.values());
    if (missingEntries.length > 0) {
      const paramValues: any[] = [];
      const valueTuples: string[] = [];

      missingEntries.forEach((entry, idx) => {
        const offset = idx * 2;
        valueTuples.push(`($${offset + 1}, $${offset + 2})`);
        paramValues.push(entry.districtId, entry.name);
      });

      const bulkInsertSql = `
        INSERT INTO talukas (district_id, name)
        VALUES ${valueTuples.join(', ')}
        ON CONFLICT (district_id, name) DO UPDATE SET
          updated_at = NOW()
        RETURNING id, district_id, name;
      `;

      const insertedRes = await query(bulkInsertSql, paramValues);
      for (const t of insertedRes.rows) {
        const uuid = t.id;
        const cleanName = t.name.toLowerCase().trim();
        talukaMap.set(uuid.toLowerCase(), uuid);
        talukaMap.set(cleanName, uuid);
        talukaMap.set(`${t.district_id}_${cleanName}`, uuid);
        logger.info(`[LookupResolverService] Auto-created missing Taluka: '${t.name}' (${uuid})`);
      }

      await CacheService.invalidatePattern('ranniti:masters:talukas*');
    }

    return talukaMap;
  }

  /**
   * Batch resolve and auto-create missing Wards.
   * Returns normalized Map<key, ward_uuid>.
   */
  static async ensureWardsExist(
    records: any[],
    acMap?: Map<string, string>,
    defaultAcId?: string
  ): Promise<Map<string, string>> {
    const wardMap = new Map<string, string>();

    const dbWards = await query(`
      SELECT w.id, w.ac_id, w.ward_number, w.name, a.name AS ac_name
      FROM wards w
      LEFT JOIN assembly_constituencies a ON w.ac_id = a.id
    `);

    for (const w of dbWards.rows) {
      const uuid = w.id;
      const cleanName = (w.name || '').toLowerCase().trim();
      wardMap.set(uuid.toLowerCase(), uuid);
      if (cleanName) wardMap.set(cleanName, uuid);
      if (w.ac_id) {
        wardMap.set(`${w.ac_id}_${w.ward_number}`, uuid);
        if (cleanName) wardMap.set(`${w.ac_id}_${cleanName}`, uuid);
      }
    }

    const maxWardNumByAc = new Map<string, number>();
    for (const w of dbWards.rows) {
      const currentMax = maxWardNumByAc.get(w.ac_id) || 0;
      if (w.ward_number > currentMax) maxWardNumByAc.set(w.ac_id, w.ward_number);
    }

    const missingEntriesMap = new Map<string, { acId: string; wardNumber: number; name: string }>();

    for (const row of records) {
      const acRef = LookupResolverService.extractValue(row, ['AC Name', 'ACName', 'acName', 'ac', 'acId', 'ac_id']).toLowerCase();
      const acId = (acMap ? acMap.get(acRef) : null) || defaultAcId;

      const wardName = LookupResolverService.extractValue(row, ['Ward Name', 'WardName', 'wardName', 'ward', 'wardId', 'ward_id']);
      let rawWardNum = Number(LookupResolverService.extractValue(row, ['Ward Number', 'WardNumber', 'wardNumber', 'ward_number']) || 0);

      if ((wardName || rawWardNum > 0) && acId) {
        const cleanLower = wardName.toLowerCase();
        const wardKey = rawWardNum > 0 ? `${acId}_${rawWardNum}` : `${acId}_${cleanLower}`;

        if (!wardMap.has(wardKey) && (!cleanLower || !wardMap.has(`${acId}_${cleanLower}`))) {
          if (!missingEntriesMap.has(wardKey)) {
            if (!rawWardNum || rawWardNum <= 0) {
              const nextNum = (maxWardNumByAc.get(acId) || 0) + 1;
              maxWardNumByAc.set(acId, nextNum);
              rawWardNum = nextNum;
            }
            missingEntriesMap.set(wardKey, {
              acId,
              wardNumber: rawWardNum,
              name: wardName || `Ward #${rawWardNum}`,
            });
          }
        }
      }
    }

    const missingEntries = Array.from(missingEntriesMap.values());
    if (missingEntries.length > 0) {
      const paramValues: any[] = [];
      const valueTuples: string[] = [];

      missingEntries.forEach((entry, idx) => {
        const offset = idx * 3;
        valueTuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
        paramValues.push(entry.acId, entry.wardNumber, entry.name);
      });

      const bulkInsertSql = `
        INSERT INTO wards (ac_id, ward_number, name)
        VALUES ${valueTuples.join(', ')}
        ON CONFLICT (ac_id, ward_number) DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = NOW()
        RETURNING id, ac_id, ward_number, name;
      `;

      const insertedRes = await query(bulkInsertSql, paramValues);
      for (const w of insertedRes.rows) {
        const uuid = w.id;
        const cleanName = (w.name || '').toLowerCase().trim();
        wardMap.set(uuid.toLowerCase(), uuid);
        if (cleanName) wardMap.set(cleanName, uuid);
        wardMap.set(`${w.ac_id}_${w.ward_number}`, uuid);
        if (cleanName) wardMap.set(`${w.ac_id}_${cleanName}`, uuid);
        logger.info(`[LookupResolverService] Auto-created missing Ward: #${w.ward_number} '${w.name}' (${uuid})`);
      }

      await CacheService.invalidatePattern('ranniti:masters:wards*');
    }

    return wardMap;
  }

  /**
   * Batch resolve and auto-create missing Booths in a single query.
   * Returns normalized Map<key, boothObject>.
   */
  static async ensureBoothsExist(
    records: any[],
    acMap?: Map<string, string>,
    wardMap?: Map<string, string>,
    defaultAcId?: string,
    defaultWardId?: string
  ): Promise<Map<string, any>> {
    const boothMap = new Map<string, any>();

    const dbBooths = await query(`
      SELECT b.id, b.ac_id, b.ward_id, b.booth_number, b.name, b.total_voters
      FROM booths b
    `);

    for (const b of dbBooths.rows) {
      const uuid = b.id;
      const cleanName = (b.name || '').toLowerCase().trim();
      const numStr = String(b.booth_number).trim();
      boothMap.set(uuid.toLowerCase(), b);
      if (cleanName) boothMap.set(cleanName, b);
      boothMap.set(numStr, b);
      if (b.ac_id) {
        boothMap.set(`${b.ac_id}_${numStr}`, b);
        if (cleanName) boothMap.set(`${b.ac_id}_${cleanName}`, b);
      }
    }

    const missingEntriesMap = new Map<string, { acId: string; wardId: string | null; boothNumber: number; name: string }>();

    for (const row of records) {
      const acRef = LookupResolverService.extractValue(row, ['AC Name', 'ACName', 'acName', 'ac', 'acId', 'ac_id']).toLowerCase();
      const acId = (acMap ? acMap.get(acRef) : null) || defaultAcId;

      const boothRef = LookupResolverService.extractValue(row, ['Select Booth', 'Booth Name', 'boothName', 'boothId', 'booth_id', 'Booth ID']);
      let rawBoothNum = Number(LookupResolverService.extractValue(row, ['Booth No', 'Booth Number', 'boothNumber', 'boothNo', 'booth_number']) || 0);

      const wardRef = LookupResolverService.extractValue(row, ['Ward Name', 'WardName', 'wardName', 'ward', 'wardId', 'ward_id']).toLowerCase();
      const wardId = (wardMap ? wardMap.get(wardRef) || (acId ? wardMap.get(`${acId}_${wardRef}`) : null) : null) || defaultWardId || null;

      if (acId && (rawBoothNum > 0 || boothRef)) {
        const numKey = `${acId}_${rawBoothNum}`;
        const nameKey = boothRef ? `${acId}_${boothRef.toLowerCase()}` : '';

        const alreadyExists = (rawBoothNum > 0 && boothMap.has(numKey)) || (nameKey && boothMap.has(nameKey));
        if (!alreadyExists) {
          const entryKey = rawBoothNum > 0 ? numKey : nameKey;
          if (!missingEntriesMap.has(entryKey)) {
            missingEntriesMap.set(entryKey, {
              acId,
              wardId,
              boothNumber: rawBoothNum || 0,
              name: boothRef || `Booth #${rawBoothNum}`,
            });
          }
        }
      }
    }

    const missingEntries = Array.from(missingEntriesMap.values());
    if (missingEntries.length > 0) {
      const paramValues: any[] = [];
      const valueTuples: string[] = [];

      missingEntries.forEach((entry, idx) => {
        const offset = idx * 4;
        valueTuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 0, NOW(), NOW())`);
        paramValues.push(entry.acId, entry.wardId, entry.boothNumber, entry.name);
      });

      const bulkInsertSql = `
        INSERT INTO booths (ac_id, ward_id, booth_number, name, total_voters, created_at, updated_at)
        VALUES ${valueTuples.join(', ')}
        ON CONFLICT (ac_id, booth_number) DO UPDATE SET
          name = EXCLUDED.name,
          ward_id = COALESCE(EXCLUDED.ward_id, booths.ward_id),
          updated_at = NOW()
        RETURNING id, ac_id, ward_id, booth_number, name, total_voters;
      `;

      const insertedRes = await query(bulkInsertSql, paramValues);
      for (const b of insertedRes.rows) {
        const uuid = b.id;
        const cleanName = (b.name || '').toLowerCase().trim();
        const numStr = String(b.booth_number).trim();
        boothMap.set(uuid.toLowerCase(), b);
        if (cleanName) boothMap.set(cleanName, b);
        boothMap.set(numStr, b);
        boothMap.set(`${b.ac_id}_${numStr}`, b);
        if (cleanName) boothMap.set(`${b.ac_id}_${cleanName}`, b);
        logger.info(`[LookupResolverService] Auto-created missing Booth: #${b.booth_number} '${b.name}' in AC ${b.ac_id}`);
      }

      await CacheService.invalidatePattern('ranniti:masters:booths*');
    }

    return boothMap;
  }

  /**
   * High-performance parallel master pre-resolver for Voter Bulk Import.
   * Resolves and auto-provisions all needed master records (States, PCs, Districts,
   * ACs, Wards, Booths, Religions, Castes, Parties) in parallel before streaming.
   */
  static async resolveVoterMasters(records: any[], context?: Record<string, any>): Promise<VoterResolvedMasters> {
    const defaultPcId = context?.pcId;
    const defaultAcId = context?.acId;
    const defaultDistrictId = context?.districtId;
    const defaultWardId = context?.wardId;

    // 1. Resolve top-level parent entities in parallel
    const [states, parties, religions] = await Promise.all([
      this.ensureStatesExist(records),
      this.ensurePartiesExist(records),
      this.ensureReligionsExist(records),
    ]);

    // 2. Resolve intermediate entities (Districts, PCs, Castes) in parallel
    const [districts, pcs, castes] = await Promise.all([
      this.ensureDistrictsExist(records, states),
      this.ensurePcsExist(records, states),
      this.ensureCastesExist(records, religions),
    ]);

    // 3. Resolve ACs (scoped to PCs & Districts)
    const acs = await this.ensureAcsExist(records, pcs, districts, defaultPcId);

    // 4. Resolve Wards (scoped to ACs)
    const wards = await this.ensureWardsExist(records, acs, defaultAcId);

    // 5. Resolve Booths (scoped to ACs & Wards)
    const booths = await this.ensureBoothsExist(records, acs, wards, defaultAcId, defaultWardId);

    return {
      states,
      pcs,
      districts,
      acs,
      wards,
      booths,
      religions,
      castes,
      parties,
    };
  }
}

