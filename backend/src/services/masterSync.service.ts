import { query } from '../queries/dbPool';
import { initialReligions, initialCastes, initialParties, initialStates } from '../seeds/data/masters.seed';
import { logger } from '../utils/logger';

export interface MasterSyncResult {
  statesSynced: number;
  religionsSynced: number;
  partiesSynced: number;
  castesSynced: number;
  durationMs: number;
}

/**
 * Service for non-destructive, automated updating of Master Datasets (States, Religions, Parties, Castes)
 * Uses PostgreSQL ON CONFLICT DO UPDATE logic to preserve foreign key UUID references.
 */
export class MasterSyncService {
  /**
   * Synchronize all Master Datasets automatically
   */
  static async syncAll(): Promise<MasterSyncResult> {
    const startTime = process.hrtime.bigint();
    logger.info('🔄 Starting Master Data Auto-Sync Process...');

    const statesSynced = await this.syncStates();
    const religionsSynced = await this.syncReligions();
    const partiesSynced = await this.syncParties();
    const castesSynced = await this.syncCastes();

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    logger.info(`✅ Master Data Auto-Sync Complete in ${Math.round(durationMs)}ms.`);

    return {
      statesSynced,
      religionsSynced,
      partiesSynced,
      castesSynced,
      durationMs: Math.round(durationMs),
    };
  }

  static async syncStates(): Promise<number> {
    if (!initialStates.length) return 0;
    const values: string[] = [];
    const params: any[] = [];
    initialStates.forEach((st, idx) => {
      values.push(`($${idx + 1})`);
      params.push(st.name);
    });
    const sql = `
      INSERT INTO states (name) VALUES ${values.join(', ')}
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW();
    `;
    await query(sql, params);
    return initialStates.length;
  }

  static async syncReligions(): Promise<number> {
    if (!initialReligions.length) return 0;
    const values: string[] = [];
    const params: any[] = [];
    initialReligions.forEach((rel, idx) => {
      values.push(`($${idx + 1})`);
      params.push(rel.name);
    });
    const sql = `
      INSERT INTO religions (name) VALUES ${values.join(', ')}
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW();
    `;
    await query(sql, params);
    return initialReligions.length;
  }

  static async syncParties(): Promise<number> {
    if (!initialParties.length) return 0;
    const values: string[] = [];
    const params: any[] = [];
    initialParties.forEach((party, idx) => {
      const p = idx * 3;
      values.push(`($${p + 1}, $${p + 2}, $${p + 3})`);
      params.push(party.name, party.abbreviation, party.symbolLogo || null);
    });
    const sql = `
      INSERT INTO parties (name, abbreviation, symbol_logo) VALUES ${values.join(', ')}
      ON CONFLICT (name) DO UPDATE 
      SET abbreviation = EXCLUDED.abbreviation, 
          symbol_logo = EXCLUDED.symbol_logo, 
          updated_at = NOW();
    `;
    await query(sql, params);
    return initialParties.length;
  }

  static async syncCastes(): Promise<number> {
    if (!initialCastes.length) return 0;
    const values: string[] = [];
    const params: any[] = [];
    initialCastes.forEach((caste, idx) => {
      const p = idx * 2;
      values.push(`($${p + 1}, $${p + 2})`);
      params.push(caste.name, caste.category);
    });
    const sql = `
      INSERT INTO castes (name, category) VALUES ${values.join(', ')}
      ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, updated_at = NOW();
    `;
    await query(sql, params);
    return initialCastes.length;
  }
}
