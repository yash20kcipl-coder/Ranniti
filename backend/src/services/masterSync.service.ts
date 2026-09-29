import { query } from '../queries/dbPool';
import { initialReligions, initialCastes, initialParties, initialStates, initialOrganizations } from '../seeds/data/masters.seed';
import { logger } from '../utils/logger';

export interface MasterSyncResult {
  statesSynced: number;
  religionsSynced: number;
  partiesSynced: number;
  castesSynced: number;
  organizationsSynced: number;
  durationMs: number;
}

/**
 * Service for non-destructive, automated updating of Master Datasets (States, Religions, Parties, Castes, Organizations)
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
    const organizationsSynced = await this.syncOrganizations();

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    logger.info(`✅ Master Data Auto-Sync Complete in ${Math.round(durationMs)}ms.`);

    return {
      statesSynced,
      religionsSynced,
      partiesSynced,
      castesSynced,
      organizationsSynced,
      durationMs: Math.round(durationMs),
    };
  }

  static async syncStates(): Promise<number> {
    let count = 0;
    for (const state of initialStates) {
      const sql = `
        INSERT INTO states (name) VALUES ($1)
        ON CONFLICT (name) DO UPDATE SET updated_at = NOW();
      `;
      await query(sql, [state.name]);
      count++;
    }
    return count;
  }

  static async syncReligions(): Promise<number> {
    let count = 0;
    for (const rel of initialReligions) {
      const sql = `
        INSERT INTO religions (name) VALUES ($1)
        ON CONFLICT (name) DO UPDATE SET updated_at = NOW();
      `;
      await query(sql, [rel.name]);
      count++;
    }
    return count;
  }

  static async syncParties(): Promise<number> {
    let count = 0;
    for (const party of initialParties) {
      const sql = `
        INSERT INTO parties (name, abbreviation, symbol_logo) VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE 
        SET abbreviation = EXCLUDED.abbreviation, 
            symbol_logo = EXCLUDED.symbol_logo, 
            updated_at = NOW();
      `;
      await query(sql, [party.name, party.abbreviation, party.symbolLogo || null]);
      count++;
    }
    return count;
  }

  static async syncCastes(): Promise<number> {
    let count = 0;
    for (const caste of initialCastes) {
      const sql = `
        INSERT INTO castes (name, category) VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, updated_at = NOW();
      `;
      await query(sql, [caste.name, caste.category]);
      count++;
    }
    return count;
  }

  static async syncOrganizations(): Promise<number> {
    let count = 0;
    for (const org of initialOrganizations) {
      const sql = `
        INSERT INTO organizations (name, code, status) VALUES ($1, $2, $3)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, updated_at = NOW();
      `;
      await query(sql, [org.name, org.code, org.status || 'active']);
      count++;
    }
    return count;
  }
}
