import { query } from './dbPool';
import { CacheService } from '../services/cache.service';

export interface AppVersionRecord {
  id: string;
  platform: 'android' | 'ios';
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateTitle: string;
  updateMessage: string;
  storeUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  createdAt: string;
  updatedAt: string;
}

const mapAppVersionRowToCamelCase = (row: any): AppVersionRecord => ({
  id: row.id,
  platform: row.platform,
  minVersion: row.min_version,
  latestVersion: row.latest_version,
  forceUpdate: Boolean(row.force_update),
  updateTitle: row.update_title || 'App Update Available',
  updateMessage: row.update_message || '',
  storeUrl: row.store_url || '',
  maintenanceMode: Boolean(row.maintenance_mode),
  maintenanceMessage: row.maintenance_message || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const appVersionQueries = {
  /**
   * Fetch all app version records (Android & iOS).
   * Cached in Redis for public mobile client lookups.
   */
  async getAppVersions(): Promise<AppVersionRecord[]> {
    const cacheKey = 'ranniti:app_versions';
    return await CacheService.getOrSet(cacheKey, 3600, async () => {
      const res = await query(`SELECT * FROM app_versions ORDER BY platform ASC`);
      
      if (res.rows.length === 0) {
        // Auto-seed default rows if empty
        const defaultSql = `
          INSERT INTO app_versions (platform, min_version, latest_version, force_update, update_title, update_message, store_url, maintenance_mode, maintenance_message)
          VALUES 
            ('android', '1.0.0', '1.0.0', false, 'App Update Available', 'A new version of Ranniti is available. Update now for performance enhancements.', 'https://play.google.com/store/apps/details?id=com.ranniti.app', false, 'Ranniti is under scheduled maintenance.'),
            ('ios', '1.0.0', '1.0.0', false, 'App Update Available', 'A new version of Ranniti is available. Update now for performance enhancements.', 'https://apps.apple.com/app/id6400000000', false, 'Ranniti is under scheduled maintenance.')
          ON CONFLICT (platform) DO UPDATE SET updated_at = NOW()
          RETURNING *;
        `;
        const seededRes = await query(defaultSql);
        return seededRes.rows.map(mapAppVersionRowToCamelCase);
      }

      return res.rows.map(mapAppVersionRowToCamelCase);
    });
  },

  /**
   * Fetch app version for a single platform
   */
  async getAppVersionByPlatform(platform: 'android' | 'ios'): Promise<AppVersionRecord | null> {
    const versions = await appVersionQueries.getAppVersions();
    return versions.find((v) => v.platform === platform) || null;
  },

  /**
   * Update app version configuration for a specific ID or platform
   */
  async updateAppVersion(
    idOrPlatform: string,
    data: Partial<AppVersionRecord>
  ): Promise<AppVersionRecord | null> {
    const isPlatform = idOrPlatform === 'android' || idOrPlatform === 'ios';
    const whereClause = isPlatform ? `platform = $1` : `id = $1`;

    // Fetch existing record to ensure COALESCE logic
    const fetchSql = `SELECT * FROM app_versions WHERE ${whereClause}`;
    const fetchRes = await query(fetchSql, [idOrPlatform]);

    if (fetchRes.rows.length === 0) {
      return null;
    }

    const current = mapAppVersionRowToCamelCase(fetchRes.rows[0]);

    const minVersion = data.minVersion !== undefined ? data.minVersion : current.minVersion;
    const latestVersion = data.latestVersion !== undefined ? data.latestVersion : current.latestVersion;
    const forceUpdate = data.forceUpdate !== undefined ? data.forceUpdate : current.forceUpdate;
    const updateTitle = data.updateTitle !== undefined ? data.updateTitle : current.updateTitle;
    const updateMessage = data.updateMessage !== undefined ? data.updateMessage : current.updateMessage;
    const storeUrl = data.storeUrl !== undefined ? data.storeUrl : current.storeUrl;
    const maintenanceMode = data.maintenanceMode !== undefined ? data.maintenanceMode : current.maintenanceMode;
    const maintenanceMessage = data.maintenanceMessage !== undefined ? data.maintenanceMessage : current.maintenanceMessage;

    const updateSql = `
      UPDATE app_versions SET
        min_version = $2,
        latest_version = $3,
        force_update = $4,
        update_title = $5,
        update_message = $6,
        store_url = $7,
        maintenance_mode = $8,
        maintenance_message = $9,
        updated_at = NOW()
      WHERE ${whereClause}
      RETURNING *
    `;

    const res = await query(updateSql, [
      idOrPlatform,
      minVersion,
      latestVersion,
      forceUpdate,
      updateTitle,
      updateMessage,
      storeUrl,
      maintenanceMode,
      maintenanceMessage,
    ]);

    // Invalidate Redis cache
    await CacheService.del('ranniti:app_versions');

    if (res.rows.length === 0) return null;
    return mapAppVersionRowToCamelCase(res.rows[0]);
  },
};
