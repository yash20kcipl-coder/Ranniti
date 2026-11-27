import { query } from '../queries/dbPool';
import { initialReligions, initialCastes, initialParties, initialStates } from '../seeds/data/masters.seed';
import { initialProfessionCategories } from '../seeds/data/professions.seed';
import { logger } from '../utils/logger';
import { MasterBroadcastSync } from './sync/masterBroadcastSync.service';

export interface MasterSyncResult {
  statesSynced: number;
  religionsSynced: number;
  partiesSynced: number;
  castesSynced: number;
  professionCategoriesSynced: number;
  professionsSynced: number;
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
    const professionCategoriesSynced = await this.syncProfessionCategories();
    const professionsSynced = await this.syncProfessions();

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    logger.info(`✅ Master Data Auto-Sync Complete in ${Math.round(durationMs)}ms.`);

    return {
      statesSynced,
      religionsSynced,
      partiesSynced,
      castesSynced,
      professionCategoriesSynced,
      professionsSynced,
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
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING *;
    `;
    const res = await query(sql, params);
    if (res.rows.length > 0) {
      await MasterBroadcastSync.broadcastBatchToAllTenants('states', res.rows).catch((err) => {
        logger.error('[MasterSyncService] Error broadcasting states to tenants:', err);
      });
    }
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
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING *;
    `;
    const res = await query(sql, params);
    if (res.rows.length > 0) {
      await MasterBroadcastSync.broadcastBatchToAllTenants('religions', res.rows).catch((err) => {
        logger.error('[MasterSyncService] Error broadcasting religions to tenants:', err);
      });
    }
    return initialReligions.length;
  }

  static async syncParties(): Promise<number> {
    if (!initialParties.length) return 0;
    const values: string[] = [];
    const params: any[] = [];
    initialParties.forEach((party, idx) => {
      const p = idx * 4;
      values.push(`($${p + 1}, $${p + 2}, $${p + 3}, $${p + 4})`);
      params.push(party.name, party.abbreviation, party.symbolLogo || null, party.alliance || null);
    });
    const sql = `
      INSERT INTO parties (name, abbreviation, symbol_logo, alliance) VALUES ${values.join(', ')}
      ON CONFLICT (name) DO UPDATE 
      SET abbreviation = EXCLUDED.abbreviation, 
          symbol_logo = EXCLUDED.symbol_logo, 
          alliance = EXCLUDED.alliance,
          updated_at = NOW()
      RETURNING *;
    `;
    const res = await query(sql, params);
    if (res.rows.length > 0) {
      await MasterBroadcastSync.broadcastBatchToAllTenants('parties', res.rows).catch((err) => {
        logger.error('[MasterSyncService] Error broadcasting parties to tenants:', err);
      });
    }
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
      ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, updated_at = NOW()
      RETURNING *;
    `;
    const res = await query(sql, params);
    if (res.rows.length > 0) {
      await MasterBroadcastSync.broadcastBatchToAllTenants('castes', res.rows).catch((err) => {
        logger.error('[MasterSyncService] Error broadcasting castes to tenants:', err);
      });
    }
    return initialCastes.length;
  }

  static async syncProfessionCategories(): Promise<number> {
    if (!initialProfessionCategories.length) return 0;
    const records: any[] = [];
    for (const cat of initialProfessionCategories) {
      const res = await query(
        `INSERT INTO profession_categories (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
         RETURNING id, name`,
        [cat.name]
      );
      if (res.rows.length > 0) {
        records.push(res.rows[0]);
      }
    }
    if (records.length > 0) {
      await MasterBroadcastSync.broadcastBatchToAllTenants('profession_categories', records).catch(() => {});
    }
    return records.length;
  }

  static async syncProfessions(): Promise<number> {
    if (!initialProfessionCategories.length) return 0;
    const records: any[] = [];
    for (const cat of initialProfessionCategories) {
      const catRes = await query(`SELECT id FROM profession_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))`, [cat.name]);
      if (!catRes.rows.length) continue;
      const categoryId = catRes.rows[0].id;
      for (const prof of cat.professions) {
        const res = await query(
          `INSERT INTO professions (category_id, name)
           VALUES ($1, $2)
           ON CONFLICT (category_id, name) DO UPDATE SET updated_at = NOW()
           RETURNING id, category_id, name`,
          [categoryId, prof]
        );
        if (res.rows.length > 0) {
          records.push(res.rows[0]);
        }
      }
    }
    if (records.length > 0) {
      await MasterBroadcastSync.broadcastBatchToAllTenants('professions', records).catch(() => {});
    }
    return records.length;
  }
}
