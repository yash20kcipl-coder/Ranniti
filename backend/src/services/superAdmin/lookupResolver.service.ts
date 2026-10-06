import { query } from '../../queries/dbPool';
import { logger } from '../../utils/logger';
import { CacheService } from '../cache.service';

/**
 * Ultra-Fast & Well-Optimized Lookup Resolver Service
 * High-performance batch resolution & auto-creation for ALL master lookup entities.
 * Uses single-query bulk SQL inserts, in-memory Map caching, and O(1) Set deduplication.
 */
export class LookupResolverService {
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
    districtKeys = ['District Name', 'DistrictName', 'districtName', 'district', 'districtId', 'district_id']
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
      const stateId = stateMap ? stateMap.get(stateRef) || null : null;

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
}
