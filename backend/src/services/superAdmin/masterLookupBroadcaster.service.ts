import { logger } from '../../utils/logger';
import { query as masterQuery } from '../../queries/dbPool';
import { getTenantDbPool } from '../../utils/tenantDbProvisioner';
import { StateProvisionService } from '../../provisioning/services/state.provision.service';
import { DistrictProvisionService } from '../../provisioning/services/district.provision.service';
import { ReligionProvisionService } from '../../provisioning/services/religion.provision.service';
import { CasteProvisionService } from '../../provisioning/services/caste.provision.service';
import { PartyProvisionService } from '../../provisioning/services/party.provision.service';
import { ProfessionProvisionService } from '../../provisioning/services/profession.provision.service';
import type { MasterCategory } from '../cacheInvalidation.service';

export class MasterLookupBroadcaster {
  private static isSyncing = false;

  /**
   * Broadcasts Master DB changes to all tenant databases asynchronously in the background.
   */
  static broadcast(categories: MasterCategory | MasterCategory[]): void {
    const list = Array.isArray(categories) ? categories : [categories];
    const supported: MasterCategory[] = [
      'states',
      'districts',
      'religions',
      'castes',
      'parties',
      'professionCategories',
      'professions',
    ];

    const toSync = list.filter((cat) => supported.includes(cat));
    if (toSync.length === 0) return;

    // Fire-and-forget in next tick to avoid blocking SuperAdmin HTTP responses
    setImmediate(async () => {
      if (this.isSyncing) {
        // Prevent concurrent broadcaster storms
        return;
      }
      this.isSyncing = true;

      try {
        const tenantsRes = await masterQuery(
          `SELECT tenant_db_name AS "tenantDbName" FROM tenants WHERE tenant_db_name IS NOT NULL`
        );
        const tenantDbs: string[] = tenantsRes.rows
          .map((r: any) => r.tenantDbName)
          .filter(Boolean);

        if (tenantDbs.length === 0) return;

        logger.info(
          `[MasterLookupBroadcaster] Broadcasting [${toSync.join(', ')}] sync across ${tenantDbs.length} tenant databases...`
        );

        for (const dbName of tenantDbs) {
          const pool = getTenantDbPool(dbName);
          try {
            for (const cat of toSync) {
              switch (cat) {
                case 'states':
                  await StateProvisionService.sync(pool).catch(() => {});
                  break;
                case 'districts':
                  await DistrictProvisionService.sync(pool).catch(() => {});
                  break;
                case 'religions':
                  await ReligionProvisionService.sync(pool).catch(() => {});
                  break;
                case 'castes':
                  await CasteProvisionService.sync(pool).catch(() => {});
                  break;
                case 'parties':
                  await PartyProvisionService.sync(pool).catch(() => {});
                  break;
                case 'professionCategories':
                case 'professions':
                  await ProfessionProvisionService.sync(pool).catch(() => {});
                  break;
              }
            }
          } catch (err: any) {
            logger.warn(
              `[MasterLookupBroadcaster] Failed to broadcast lookup to tenant DB '${dbName}': ${err.message}`
            );
          } finally {
            await pool.end().catch(() => {});
          }
        }

        logger.info(
          `[MasterLookupBroadcaster] Successfully broadcasted [${toSync.join(', ')}] across all tenants.`
        );
      } catch (err: any) {
        logger.error(`[MasterLookupBroadcaster] Error during background lookup broadcast:`, err);
      } finally {
        this.isSyncing = false;
      }
    });
  }
}
