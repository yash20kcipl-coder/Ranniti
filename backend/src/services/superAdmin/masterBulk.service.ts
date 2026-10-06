import ExcelJS from 'exceljs';
import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { CacheService } from '../cache.service';
import { importJobTracker } from '../importJobTracker';
import { BulkImporter } from '../../utils/bulkImporter';
import { MasterQueries } from '../../queries/master.queries';
import { LookupResolverService } from './lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { calculateAge, formatDateForDb } from '../../utils/dateUtils';
import { FamilyMappingService } from '../tenant/familyMapping.service';

export class MasterBulkService {
  /**
   * Process asynchronous bulk import job in background with Name Resolution & Auto-Creation
   */
  static async processBulkImportJob(jobId: string, category: string, records: Record<string, any>[], context?: Record<string, any>): Promise<void> {
    try {
      logger.info(`[MasterBulkService] Starting background import job ${jobId} for category '${category}' (${records.length} records)`);

      const progressCallback = (p: { processed: number; inserted: number; failed: number }) => {
        importJobTracker.updateProgress(jobId, p.processed, p.inserted, p.failed);
      };

      let result;

      switch (category.toLowerCase()) {
        case 'religions':
        case 'religion': {
          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert = batch
                .map((row) => ({ name: (row.name || row.religionName || '').trim() }))
                .filter((r) => r.name.length > 0);
              const uniqueRowsMap = new Map<string, any>();
              for (const r of rowsToInsert) {
                uniqueRowsMap.set(r.name.toLowerCase(), r);
              }
              const deduplicatedRows = Array.from(uniqueRowsMap.values());
              if (deduplicatedRows.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'religions',
                deduplicatedRows,
                ['name'],
                { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:religions*');
          try {
            const allReligions = await MasterQueries.getReligions().catch(() => []);
            const { MasterBroadcastSync } = await import('../sync/masterBroadcastSync.service');
            await MasterBroadcastSync.broadcastBatchToAllTenants('religions', allReligions.map((r) => ({ id: r.id, name: r.name })));
          } catch (broadcastErr) {
            logger.error('[MasterBulkService] Failed to broadcast religions to tenants:', broadcastErr);
          }
          break;
        }

        case 'castes':
        case 'caste': {
          const religionMap = await LookupResolverService.ensureReligionsExist(records);
          const casteNameToIdMap = await LookupResolverService.ensureCastesExist(records, religionMap);

          // Separate parent castes (no parentCasteName) from subcastes
          const parentRows = records.filter((r) => !r.parentCasteName && !r.parent_caste_id && !r.parentCasteId);
          const subcasteRows = records.filter((r) => r.parentCasteName || r.parent_caste_id || r.parentCasteId);

          let totalProcessed = 0;
          let totalInserted = 0;
          let totalFailed = 0;

          // PASS 1: Insert parent castes
          const pass1Result = await BulkImporter.processArray(parentRows, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: (p) => {
              importJobTracker.updateProgress(jobId, p.processed, p.inserted, p.failed);
            },
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row.name || row.casteName || '').trim();
                const categoryName = (row.category || 'General').trim();
                const religionRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
                const religionId = religionMap.get(religionRef) || null;

                if (name && categoryName) {
                  rowsToInsert.push({ name, category: categoryName, religion_id: religionId, parent_caste_id: null });
                }
              }
              const uniqueRowsMap = new Map<string, any>();
              for (const r of rowsToInsert) {
                uniqueRowsMap.set(r.name.toLowerCase(), r);
              }
              const deduplicatedRows = Array.from(uniqueRowsMap.values());
              if (deduplicatedRows.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'castes',
                deduplicatedRows,
                ['name', 'category', 'religion_id', 'parent_caste_id'],
                { conflictTarget: ['name'], conflictStrategy: 'DO UPDATE', updateColumns: ['religion_id', 'category'] }
              );
              return res.insertedCount;
            },
          });

          totalProcessed += pass1Result.totalProcessed;
          totalInserted += pass1Result.insertedCount;
          totalFailed += pass1Result.failedCount;

          // Refresh caste name→id map from DB directly after pass 1
          const allCastesAfterPass1 = await query(`SELECT id, name FROM castes`);
          for (const c of allCastesAfterPass1.rows) {
            casteNameToIdMap.set(c.name.toLowerCase().trim(), c.id);
          }

          // Auto-create any missing parent castes referenced by subcastes
          for (const row of subcasteRows) {
            const pName = (row.parentCasteName || row.parent_caste_name || '').toString().trim();
            if (pName && !casteNameToIdMap.has(pName.toLowerCase())) {
              const religionRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
              const religionId = religionMap.get(religionRef) || null;
              const categoryName = (row.category || 'General').trim();

              const newParentRes = await query(
                `INSERT INTO castes (name, category, religion_id) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id, name`,
                [pName, categoryName, religionId]
              );
              if (newParentRes.rows[0]) {
                casteNameToIdMap.set(pName.toLowerCase(), newParentRes.rows[0].id);
                logger.info(`[MasterBulkService] Auto-created missing parent caste during caste import: '${newParentRes.rows[0].name}' (${newParentRes.rows[0].id})`);
              }
            }
          }

          // PASS 2: Insert subcastes with resolved parentCasteId
          if (subcasteRows.length > 0) {
            const pass2Result = await BulkImporter.processArray(subcasteRows, {
              batchSize: 2500,
              concurrency: 2,
              onProgress: (p) => {
                importJobTracker.updateProgress(
                  jobId,
                  totalProcessed + p.processed,
                  totalInserted + p.inserted,
                  totalFailed + p.failed
                );
              },
              onBatchInsert: async (batch) => {
                const rowsToInsert: any[] = [];
                for (const row of batch) {
                  const name = (row.name || row.casteName || '').trim();
                  const categoryName = (row.category || 'General').trim();
                  const religionRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
                  const religionId = religionMap.get(religionRef) || null;

                  // Resolve parent caste: try name lookup first, then direct ID
                  const parentCasteName = (row.parentCasteName || row.parent_caste_name || '').toString().toLowerCase().trim();
                  const parentCasteId = casteNameToIdMap.get(parentCasteName) || row.parentCasteId || row.parent_caste_id || null;

                  if (name && categoryName) {
                    rowsToInsert.push({ name, category: categoryName, religion_id: religionId, parent_caste_id: parentCasteId });
                  }
                }
                const uniqueRowsMap = new Map<string, any>();
                for (const r of rowsToInsert) {
                  uniqueRowsMap.set(r.name.toLowerCase(), r);
                }
                const deduplicatedRows = Array.from(uniqueRowsMap.values());
                if (deduplicatedRows.length === 0) return 0;
                const res = await BatchInsertQuery.executeBatchImport(
                  'castes',
                  deduplicatedRows,
                  ['name', 'category', 'religion_id', 'parent_caste_id'],
                  { conflictTarget: ['name'], conflictStrategy: 'DO UPDATE', updateColumns: ['religion_id', 'category', 'parent_caste_id'], extraUpdateSql: 'updated_at = NOW()' }
                );
                return res.insertedCount;
              },
            });

            totalProcessed += pass2Result.totalProcessed;
            totalInserted += pass2Result.insertedCount;
            totalFailed += pass2Result.failedCount;
          }

          result = { totalProcessed, insertedCount: totalInserted, failedCount: totalFailed };
          await CacheService.invalidatePattern('ranniti:masters:castes*');
          try {
            const allCastes = await MasterQueries.getCastes().catch(() => []);
            const { MasterBroadcastSync } = await import('../sync/masterBroadcastSync.service');
            await MasterBroadcastSync.broadcastBatchToAllTenants(
              'castes',
              allCastes.map((c) => ({
                id: c.id,
                name: c.name,
                category: c.category,
                religion_id: c.religionId || null,
                parent_caste_id: c.parentCasteId || null,
              }))
            );
          } catch (broadcastErr) {
            logger.error('[MasterBulkService] Failed to broadcast castes to tenants:', broadcastErr);
          }
          break;
        }


        case 'states':
        case 'state': {
          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert = batch
                .map((row) => ({ name: (row['State Name'] || row.StateName || row.name || row.stateName || '').trim() }))
                .filter((r) => r.name.length > 0);
              const uniqueRowsMap = new Map<string, any>();
              for (const r of rowsToInsert) {
                uniqueRowsMap.set(r.name.toLowerCase(), r);
              }
              const deduplicatedRows = Array.from(uniqueRowsMap.values());
              if (deduplicatedRows.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'states',
                deduplicatedRows,
                ['name'],
                { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
              );
              await MasterQueries.getStates(); // Warm cache
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:states*');
          break;
        }

        case 'districts':
        case 'district': {
          const stateMap = await LookupResolverService.ensureStatesExist(records);
          const districtMap = await LookupResolverService.ensureDistrictsExist(records, stateMap);

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row['District Name'] || row.DistrictName || row.name || row.districtName || '').trim();
                const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
                const stateId = stateMap.get(stateRef) || context?.stateId;

                if (name && stateId) {
                  rowsToInsert.push({ state_id: stateId, name });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'districts',
                rowsToInsert,
                ['state_id', 'name'],
                { conflictTarget: ['state_id', 'name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:districts*');
          break;
        }

        case 'talukas':
        case 'taluka': {
          const [districts, states] = await Promise.all([
            MasterQueries.getDistricts().catch(() => []),
            MasterQueries.getStates().catch(() => []),
          ]);
          const stateMap = new Map<string, string>();
          for (const s of states) {
            stateMap.set(s.id.toLowerCase(), s.id);
            stateMap.set(s.name.toLowerCase().trim(), s.id);
          }
          const districtMap = new Map<string, string>();
          for (const d of districts) {
            districtMap.set(d.id.toLowerCase(), d.id);
            districtMap.set(d.name.toLowerCase().trim(), d.id);
            if (d.stateId && d.name) {
              districtMap.set(`${d.stateId}_${d.name}`.toLowerCase().trim(), d.id);
              if (d.stateName) {
                districtMap.set(`${d.stateName}_${d.name}`.toLowerCase().trim(), d.id);
              }
            }
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row['Taluka Name'] || row.TalukaName || row.name || row.talukaName || row.taluka || row.Tehsil || '').trim();
                const districtRef = String(row['District Name'] || row.DistrictName || row.districtName || row.district || row.districtId || row.district_id || '').toLowerCase().trim();
                const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();

                let districtId = districtMap.get(`${stateRef}_${districtRef}`) || districtMap.get(districtRef) || context?.districtId;

                if (!districtId && districtRef) {
                  let stateId = stateMap.get(stateRef);
                  if (!stateId && stateRef) {
                    try {
                      const newState = await MasterQueries.createState(stateRef.toUpperCase());
                      stateId = newState.id;
                      stateMap.set(newState.id.toLowerCase(), newState.id);
                      stateMap.set(newState.name.toLowerCase().trim(), newState.id);
                    } catch (e) {
                      const reStates = await MasterQueries.getStates().catch(() => []);
                      for (const s of reStates) {
                        stateMap.set(s.id.toLowerCase(), s.id);
                        stateMap.set(s.name.toLowerCase().trim(), s.id);
                      }
                      stateId = stateMap.get(stateRef);
                    }
                  }
                  if (stateId) {
                    try {
                      const newDist = await MasterQueries.createDistrict(stateId, districtRef.toUpperCase());
                      districtId = newDist.id;
                      districtMap.set(newDist.id.toLowerCase(), newDist.id);
                      districtMap.set(newDist.name.toLowerCase().trim(), newDist.id);
                      districtMap.set(`${stateId}_${districtRef}`, newDist.id);
                      districtMap.set(`${stateRef}_${districtRef}`, newDist.id);
                    } catch (e) {
                      const reDists = await MasterQueries.getDistricts().catch(() => []);
                      for (const d of reDists) {
                        districtMap.set(d.id.toLowerCase(), d.id);
                        districtMap.set(d.name.toLowerCase().trim(), d.id);
                      }
                      districtId = districtMap.get(`${stateRef}_${districtRef}`) || districtMap.get(districtRef);
                    }
                  }
                }

                if (name && districtId) {
                  rowsToInsert.push({
                    district_id: districtId,
                    name,
                  });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'talukas',
                rowsToInsert,
                ['district_id', 'name'],
                { conflictTarget: ['district_id', 'name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:talukas*');
          break;
        }

        case 'villages':
        case 'village': {
          const [talukas, districts, states] = await Promise.all([
            MasterQueries.getTalukas().catch(() => []),
            MasterQueries.getDistricts().catch(() => []),
            MasterQueries.getStates().catch(() => []),
          ]);

          const stateMap = new Map<string, string>();
          for (const s of states) {
            stateMap.set(s.id.toLowerCase(), s.id);
            stateMap.set(s.name.toLowerCase().trim(), s.id);
          }

          const districtMap = new Map<string, string>();
          for (const d of districts) {
            districtMap.set(d.id.toLowerCase(), d.id);
            districtMap.set(d.name.toLowerCase().trim(), d.id);
            if (d.stateId && d.name) {
              districtMap.set(`${d.stateId}_${d.name}`.toLowerCase().trim(), d.id);
              if (d.stateName) {
                districtMap.set(`${d.stateName}_${d.name}`.toLowerCase().trim(), d.id);
              }
            }
          }

          const talukaMap = new Map<string, string>();
          for (const t of talukas) {
            talukaMap.set(t.id.toLowerCase(), t.id);
            talukaMap.set(t.name.toLowerCase().trim(), t.id);
            if (t.districtId && t.name) {
              talukaMap.set(`${t.districtId}_${t.name}`.toLowerCase().trim(), t.id);
              if (t.districtName) {
                talukaMap.set(`${t.districtName}_${t.name}`.toLowerCase().trim(), t.id);
              }
            }
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row['Village Name'] || row.VillageName || row.name || row.villageName || row.village || '').trim();
                const rawTalukaName = (row['Taluka Name'] || row.TalukaName || row.talukaName || row.taluka || row.talukaId || row.taluka_id || '').trim();
                const rawDistrictName = (row['District Name'] || row.DistrictName || row.districtName || row.district || '').trim();
                const rawStateName = (row['State Name'] || row.StateName || row.stateName || row.state || '').trim();

                const talukaRef = rawTalukaName.toLowerCase().trim();
                const districtRef = rawDistrictName.toLowerCase().trim();
                const stateRef = rawStateName.toLowerCase().trim();

                let talukaId = talukaMap.get(`${districtRef}_${talukaRef}`) || talukaMap.get(talukaRef) || context?.talukaId;

                // Auto-create missing Taluka if District exists or can be matched
                if (!talukaId && rawTalukaName) {
                  let districtId = districtMap.get(`${stateRef}_${districtRef}`) || districtMap.get(districtRef) || context?.districtId;

                  if (!districtId && rawDistrictName) {
                    let stateId = stateMap.get(stateRef);
                    if (!stateId && stateRef) {
                      try {
                        const newState = await MasterQueries.createState(rawStateName.toUpperCase());
                        stateId = newState.id;
                        stateMap.set(newState.id.toLowerCase(), newState.id);
                        stateMap.set(newState.name.toLowerCase().trim(), newState.id);
                      } catch (e) {
                        const reStates = await MasterQueries.getStates().catch(() => []);
                        for (const s of reStates) {
                          stateMap.set(s.id.toLowerCase(), s.id);
                          stateMap.set(s.name.toLowerCase().trim(), s.id);
                        }
                        stateId = stateMap.get(stateRef);
                      }
                    }
                    if (stateId) {
                      try {
                        const newDist = await MasterQueries.createDistrict(stateId, rawDistrictName);
                        districtId = newDist.id;
                        districtMap.set(newDist.id.toLowerCase(), newDist.id);
                        districtMap.set(newDist.name.toLowerCase().trim(), newDist.id);
                        districtMap.set(`${stateId}_${districtRef}`, newDist.id);
                        districtMap.set(`${stateRef}_${districtRef}`, newDist.id);
                      } catch (e) {
                        const reDists = await MasterQueries.getDistricts().catch(() => []);
                        for (const d of reDists) {
                          districtMap.set(d.id.toLowerCase(), d.id);
                          districtMap.set(d.name.toLowerCase().trim(), d.id);
                        }
                        districtId = districtMap.get(`${stateRef}_${districtRef}`) || districtMap.get(districtRef);
                      }
                    }
                  }

                  if (districtId) {
                    try {
                      const newTaluka = await MasterQueries.createTaluka(districtId, rawTalukaName);
                      talukaId = newTaluka.id;
                      talukaMap.set(newTaluka.id.toLowerCase(), newTaluka.id);
                      talukaMap.set(newTaluka.name.toLowerCase().trim(), newTaluka.id);
                      talukaMap.set(`${districtId}_${rawTalukaName.toLowerCase().trim()}`, newTaluka.id);
                      if (rawDistrictName) {
                        talukaMap.set(`${districtRef}_${rawTalukaName.toLowerCase().trim()}`, newTaluka.id);
                      }
                    } catch (e) {
                      const reTalukas = await MasterQueries.getTalukas().catch(() => []);
                      for (const t of reTalukas) {
                        talukaMap.set(t.id.toLowerCase(), t.id);
                        talukaMap.set(t.name.toLowerCase().trim(), t.id);
                      }
                      talukaId = talukaMap.get(`${districtRef}_${talukaRef}`) || talukaMap.get(talukaRef);
                    }
                  }
                }

                if (name && talukaId) {
                  rowsToInsert.push({
                    taluka_id: talukaId,
                    name,
                  });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'villages',
                rowsToInsert,
                ['taluka_id', 'name'],
                { conflictTarget: ['taluka_id', 'name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:villages*');
          break;
        }

        case 'pcs':
        case 'pc':
        case 'parliamentary_constituencies':
        case 'parliamentary_constituency': {
          const stateMap = await LookupResolverService.ensureStatesExist(records);
          const pcMap = await LookupResolverService.ensurePcsExist(records, stateMap);

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row['PC Name'] || row.PCName || row.name || row.pcName || '').trim();
                const pcNum = Number(row['PC Number'] || row.PCNumber || row.pcNumber || row.pc_number || 1);
                const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
                const stateId = stateMap.get(stateRef) || context?.stateId;

                if (name && stateId) {
                  rowsToInsert.push({ state_id: stateId, pc_number: pcNum, name });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'parliamentary_constituencies',
                rowsToInsert,
                ['state_id', 'pc_number', 'name'],
                {
                  conflictTarget: ['state_id', 'pc_number'],
                  conflictStrategy: 'DO UPDATE',
                  updateColumns: ['name']
                }
              );
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:pcs*');
          break;
        }

        case 'acs':
        case 'ac':
        case 'assembly_constituencies':
        case 'assembly_constituency': {
          const stateMap = await LookupResolverService.ensureStatesExist(records);
          const districtMap = await LookupResolverService.ensureDistrictsExist(records, stateMap);
          const pcMap = await LookupResolverService.ensurePcsExist(records, stateMap);

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row['AC Name'] || row.ACName || row.name || row.acName || row.ac_name || '').trim();
                const acNum = Number(row['AC Number'] || row.ACNumber || row.acNumber || row.ac_number || 1);
                const pcRef = String(row['PC Name'] || row.PCName || row.pcName || row.pc || row.pcId || row.pc_id || '').toLowerCase().trim();
                const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();

                let pcId = pcMap.get(`${stateRef}_${pcRef}`) || pcMap.get(pcRef) || context?.pcId;

                const districtRef = String(row['District Name'] || row.DistrictName || row.districtName || row.district || row.districtId || row.district_id || '').toLowerCase().trim();
                const districtId = districtMap.get(`${stateRef}_${districtRef}`) || districtMap.get(districtRef) || context?.districtId || null;

                if (name && pcId) {
                  rowsToInsert.push({
                    pc_id: pcId,
                    ac_number: acNum,
                    name,
                    district_id: districtId,
                  });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'assembly_constituencies',
                rowsToInsert,
                ['pc_id', 'ac_number', 'name', 'district_id'],
                {
                  conflictTarget: ['pc_id', 'ac_number'],
                  conflictStrategy: 'DO UPDATE',
                  updateColumns: ['name', 'district_id']
                }
              );
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:acs*');
          break;
        }

        case 'wards':
        case 'ward': {
          const acs = await MasterQueries.getAcs().catch(() => []);
          const acMap = new Map<string, string>();
          for (const a of acs) {
            acMap.set(a.id.toLowerCase(), a.id);
            acMap.set(a.name.toLowerCase().trim(), a.id);
            if (a.pcName && a.name) {
              acMap.set(`${a.pcName}_${a.name}`.toLowerCase().trim(), a.id);
            }
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row['Ward Name'] || row.WardName || row.name || row.wardName || '').trim();
                const wardNum = Number(row['Ward Number'] || row.WardNumber || row.wardNumber || row.ward_number || 1);
                const acRef = String(row['AC Name'] || row.ACName || row.acName || row.ac || row.acId || row.ac_id || '').toLowerCase().trim();
                const pcRef = String(row['PC Name'] || row.PCName || row.pcName || row.pc || '').toLowerCase().trim();

                const acId = acMap.get(`${pcRef}_${acRef}`) || acMap.get(acRef) || context?.acId;

                if (name && acId) {
                  rowsToInsert.push({
                    ac_id: acId,
                    ward_number: wardNum,
                    name,
                  });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'wards',
                rowsToInsert,
                ['ac_id', 'ward_number', 'name'],
                { conflictTarget: ['ac_id', 'ward_number'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          await CacheService.invalidatePattern('ranniti:masters:wards*');

          // Broadcast newly imported wards to scoped tenants per AC
          try {
            const { MasterBroadcastSync } = await import('../sync/masterBroadcastSync.service');
            const touchedAcIds = Array.from(
              new Set(
                records
                  .map((r) => {
                    const acRef = String(r['AC Name'] || r.ACName || r.acName || r.ac || r.acId || r.ac_id || '').toLowerCase().trim();
                    return acMap.get(acRef) || context?.acId;
                  })
                  .filter(Boolean)
              )
            ) as string[];

            for (const acId of touchedAcIds) {
              const wardsRes = await MasterQueries.getWards(acId);
              const rawList = Array.isArray(wardsRes) ? wardsRes : ((wardsRes as any)?.data || []);
              const wardRows = rawList.map((w: any) => ({
                id: w.id,
                ac_id: w.acId || w.ac_id,
                ward_number: w.wardNumber || w.ward_number,
                name: w.name,
              }));
              if (wardRows.length > 0) {
                await MasterBroadcastSync.broadcastBatchToScopedTenants('wards', wardRows, acId);
              }
            }
          } catch (broadcastErr) {
            logger.error('[MasterBulkService] Failed to broadcast wards to scoped tenants:', broadcastErr);
          }
          break;
        }

        case 'booths':
        case 'booth':
        case 'polling_booths':
        case 'polling_booth': {
          const [acs, wards] = await Promise.all([
            MasterQueries.getAcs().catch(() => []),
            MasterQueries.getWards().catch(() => []),
          ]);
          const acMap = new Map<string, string>();
          for (const a of acs) {
            acMap.set(a.id.toLowerCase(), a.id);
            acMap.set(a.name.toLowerCase().trim(), a.id);
          }
          const wardMap = new Map<string, string>();
          for (const w of wards) {
            wardMap.set(w.id.toLowerCase(), w.id);
            wardMap.set(w.name.toLowerCase().trim(), w.id);
            wardMap.set(`${w.acId}_${w.wardNumber}`.toLowerCase(), w.id);
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row['Booth Name'] || row.BoothName || row.name || row.boothName || '').trim();
                const boothNum = Number(row['Booth Number'] || row.BoothNumber || row.boothNumber || row.booth_number || 1);
                const acRef = String(row['AC Name'] || row.ACName || row.acName || row.ac || row.acId || row.ac_id || '').toLowerCase().trim();
                let acId = acMap.get(acRef) || context?.acId;

                // Auto-create missing AC if context.pcId is provided (Option A)
                if (!acId && acRef && context?.pcId) {
                  try {
                    const newAc = await MasterQueries.createAc(context.pcId, 1, acRef, context.districtId);
                    acId = newAc.id;
                    acMap.set(newAc.id.toLowerCase(), newAc.id);
                    acMap.set(newAc.name.toLowerCase().trim(), newAc.id);
                  } catch {
                    const reAcs = await MasterQueries.getAcs().catch(() => []);
                    for (const a of reAcs) {
                      acMap.set(a.id.toLowerCase(), a.id);
                      acMap.set(a.name.toLowerCase().trim(), a.id);
                    }
                    acId = acMap.get(acRef);
                  }
                }

                const wardRef = String(row['Ward Name'] || row.WardName || row.wardName || row.ward || row.wardId || row.ward_id || '').toLowerCase().trim();
                const wardId = wardMap.get(wardRef) || (acId && (row['Ward Number'] || row.wardNumber) ? wardMap.get(`${acId}_${row['Ward Number'] || row.wardNumber}`.toLowerCase()) : null);

                if (name && acId) {
                  rowsToInsert.push({
                    ac_id: acId,
                    ward_id: wardId || null,
                    booth_number: boothNum,
                    name,
                    location_building: row['Location Building'] || row.LocationBuilding || row.locationBuilding || row.location_building || null,
                    total_voters: Number(row['Total Voters'] || row.TotalVoters || row.totalVoters || row.total_voters || 0),
                  });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'booths',
                rowsToInsert,
                ['ac_id', 'ward_id', 'booth_number', 'name', 'location_building', 'total_voters'],
                { conflictTarget: ['ac_id', 'booth_number'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          // Broadcast newly imported booths to scoped tenants per AC
          try {
            const { MasterBroadcastSync } = await import('../sync/masterBroadcastSync.service');
            const touchedAcIds = Array.from(
              new Set(
                records
                  .map((r) => {
                    const acRef = String(r['AC Name'] || r.ACName || r.acName || r.ac || r.acId || r.ac_id || '').toLowerCase().trim();
                    return acMap.get(acRef) || context?.acId;
                  })
                  .filter(Boolean)
              )
            ) as string[];

            for (const acId of touchedAcIds) {
              const boothsRes = await MasterQueries.getBooths({ acId });
              const rawList = Array.isArray(boothsRes) ? boothsRes : (boothsRes?.data || []);
              const boothRows = rawList.map((b: any) => ({
                id: b.id,
                ac_id: b.acId || b.ac_id,
                ward_id: b.wardId || b.ward_id || null,
                booth_number: b.boothNumber || b.booth_number,
                name: b.name,
                location_building: b.locationBuilding || b.location_building || null,
                total_voters: b.totalVoters || b.total_voters || 0,
              }));
              if (boothRows.length > 0) {
                await MasterBroadcastSync.broadcastBatchToScopedTenants('booths', boothRows, acId);
              }
            }
          } catch (broadcastErr) {
            logger.error('[MasterBulkService] Failed to broadcast booths to scoped tenants:', broadcastErr);
          }
          break;
        }

        case 'parties':
        case 'party':
        case 'political_parties':
        case 'political_party': {
          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert = batch
                .map((row) => ({
                  name: (row.name || row.partyName || '').trim(),
                  abbreviation: (row.abbreviation || row.code || '').trim(),
                  symbol_logo: row.symbolLogo || row.symbol_logo || null,
                }))
                .filter((r) => r.name.length > 0 && r.abbreviation.length > 0);
              const uniqueRowsMap = new Map<string, any>();
              for (const r of rowsToInsert) {
                uniqueRowsMap.set(r.name.toLowerCase(), r);
              }
              const deduplicatedRows = Array.from(uniqueRowsMap.values());
              if (deduplicatedRows.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'parties',
                deduplicatedRows,
                ['name', 'abbreviation', 'symbol_logo'],
                { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          try {
            const allParties = await MasterQueries.getParties().catch(() => []);
            const { MasterBroadcastSync } = await import('../sync/masterBroadcastSync.service');
            await MasterBroadcastSync.broadcastBatchToAllTenants(
              'parties',
              allParties.map((p) => ({
                id: p.id,
                name: p.name,
                abbreviation: p.abbreviation,
                symbol_logo: p.symbolLogo || null,
              }))
            );
          } catch (broadcastErr) {
            logger.error('[MasterBulkService] Failed to broadcast parties to tenants:', broadcastErr);
          }
          break;
        }

        case 'voters':
        case 'voter': {
          const { VoterQueries } = await import('../../queries/voter.queries');
          const { MasterQueries } = await import('../../queries/master.queries');

          // Pre-fetch all master tables once before batch processing (avoiding repetitive queries per batch)
          const [booths, religions, castes, parties, states, districts, pcs, acs] = await Promise.all([
            MasterQueries.getBooths(),
            MasterQueries.getReligions(),
            MasterQueries.getCastes(),
            MasterQueries.getParties().catch(() => []),
            MasterQueries.getStates().catch(() => []),
            MasterQueries.getDistricts().catch(() => []),
            MasterQueries.getPcs().catch(() => []),
            MasterQueries.getAcs().catch(() => []),
          ]);

          // Build O(1) in-memory lookup maps for instant key access
          const boothById = new Map<string, any>();
          const boothByName = new Map<string, any>();
          const boothByNum = new Map<string, any>();
          for (const b of booths) {
            boothById.set(b.id, b);
            boothByName.set(b.name.toLowerCase().trim(), b);
            if (b.boothNumber !== undefined && b.boothNumber !== null) {
              boothByNum.set(String(b.boothNumber).trim(), b);
            }
          }

          const acById = new Map<string, any>();
          const acByName = new Map<string, any>();
          for (const a of acs) {
            acById.set(a.id, a);
            acByName.set(a.name.toLowerCase().trim(), a);
          }

          const pcById = new Map<string, any>();
          const pcByName = new Map<string, any>();
          for (const p of pcs) {
            pcById.set(p.id, p);
            pcByName.set(p.name.toLowerCase().trim(), p);
          }

          const distById = new Map<string, any>();
          const distByName = new Map<string, any>();
          for (const d of districts) {
            distById.set(d.id, d);
            distByName.set(d.name.toLowerCase().trim(), d);
          }

          const stateById = new Map<string, any>();
          const stateByName = new Map<string, any>();
          for (const s of states) {
            stateById.set(s.id, s);
            stateByName.set(s.name.toLowerCase().trim(), s);
          }

          // Ultra-fast auto-creation of missing religions & castes for voter records
          const religionByNameOrId = await LookupResolverService.ensureReligionsExist(records);
          const casteByNameOrId = await LookupResolverService.ensureCastesExist(records, religionByNameOrId);

          const partyByNameOrAbbr = new Map<string, string>();
          for (const p of parties) {
            partyByNameOrAbbr.set(p.id.toLowerCase(), p.id);
            partyByNameOrAbbr.set(p.name.toLowerCase().trim(), p.id);
            if (p.abbreviation) {
              partyByNameOrAbbr.set(p.abbreviation.toLowerCase().trim(), p.id);
            }
          }

          const parseBool = (val: any): boolean => {
            if (val === true || val === 1) return true;
            if (typeof val === 'string') {
              const lower = val.trim().toLowerCase();
              return lower === 'yes' || lower === 'true' || lower === '1' || lower === 'y';
            }
            return false;
          };

          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const votersToInsert: any[] = [];

              for (const row of batch) {
                const epicNo = (
                  row['EPIC No'] ||
                  row['EPIC_NO'] ||
                  row['IdCardNo'] ||
                  row['Id Card No'] ||
                  row['epicNo'] ||
                  row['epic_no'] ||
                  ''
                ).toString().trim();
                if (!epicNo) continue;

                // Resolve Booth & Hierarchy (O(1) Map lookup)
                const boothRef = (
                  row['Select Booth'] ||
                  row['Booth Name'] ||
                  row['boothName'] ||
                  row['boothId'] ||
                  row['booth_id'] ||
                  row['Booth ID'] ||
                  row['Booth_ID'] ||
                  ''
                ).toString().trim();
                const boothNumRef = row['Booth No'] || row['Booth Number'] || row['boothNumber'] || row['boothNo'] || row['booth_number'];

                let boothId: string | undefined = undefined;
                let resolvedBooth: any = undefined;
                if (boothRef) {
                  resolvedBooth = boothById.get(boothRef) || boothByName.get(boothRef.toLowerCase()) || boothByNum.get(boothRef);
                }
                if (!resolvedBooth && boothNumRef !== undefined && boothNumRef !== '') {
                  resolvedBooth = boothByNum.get(String(boothNumRef).trim());
                }
                if (resolvedBooth) {
                  boothId = resolvedBooth.id;
                }

                // Resolve AC, PC, District, State with O(1) lookups
                let acId: string | undefined = resolvedBooth?.acId;
                const acRef = (
                  row['AC Name'] ||
                  row['acName'] ||
                  row['acId'] ||
                  row['ac_id'] ||
                  row['AC ID'] ||
                  row['AC_ID'] ||
                  row['AC Number'] ||
                  row['acNumber'] ||
                  row['ac_number'] ||
                  ''
                ).toString().trim();
                if (!acId && acRef) {
                  const foundAc = acById.get(acRef) || acByName.get(acRef.toLowerCase());
                  if (foundAc) acId = foundAc.id;
                }

                let pcId: string | undefined = undefined;
                const pcRef = (
                  row['PC Name'] ||
                  row['pcName'] ||
                  row['pcId'] ||
                  row['pc_id'] ||
                  row['pId'] ||
                  row['p_id'] ||
                  row['PC ID'] ||
                  row['PC_ID'] ||
                  row['PC Number'] ||
                  row['pcNumber'] ||
                  row['pc_number'] ||
                  row['PC No'] ||
                  ''
                ).toString().trim();

                if (pcRef) {
                  const foundPc = pcById.get(pcRef) || pcByName.get(pcRef.toLowerCase());
                  if (foundPc) pcId = foundPc.id;
                }
                if (!pcId && acId) {
                  const parentAc = acById.get(acId);
                  if (parentAc?.pcId) pcId = parentAc.pcId;
                }

                let districtId: string | undefined = undefined;
                const distRef = (
                  row['District Name'] ||
                  row['districtName'] ||
                  row['districtId'] ||
                  row['district_id'] ||
                  row['District ID'] ||
                  row['District_ID'] ||
                  ''
                ).toString().trim();

                if (distRef) {
                  const foundDist = distById.get(distRef) || distByName.get(distRef.toLowerCase());
                  if (foundDist) districtId = foundDist.id;
                }
                if (!districtId && acId) {
                  const parentAc = acById.get(acId);
                  if (parentAc?.districtId) districtId = parentAc.districtId;
                }

                let stateId: string | undefined = undefined;
                const stateRef = (
                  row['State Name'] ||
                  row['stateName'] ||
                  row['stateId'] ||
                  row['state_id'] ||
                  row['State ID'] ||
                  row['State_ID'] ||
                  ''
                ).toString().trim();

                if (stateRef) {
                  const foundState = stateById.get(stateRef) || stateByName.get(stateRef.toLowerCase());
                  if (foundState) stateId = foundState.id;
                }
                if (!stateId && districtId) {
                  const parentDist = distById.get(districtId);
                  if (parentDist?.stateId) stateId = parentDist.stateId;
                }
                if (!stateId && pcId) {
                  const parentPc = pcById.get(pcId);
                  if (parentPc?.stateId) stateId = parentPc.stateId;
                }
                if (!stateId && acId) {
                  const parentAc = acById.get(acId);
                  if (parentAc?.stateId) stateId = parentAc.stateId;
                }
                if (!stateId && stateRef) {
                  const foundState = stateById.get(stateRef) || stateByName.get(stateRef.toLowerCase());
                  if (foundState) stateId = foundState.id;
                }

                // Resolve Party (O(1) Map lookup)
                const partyRef = (row['Party'] || row['partyName'] || row['partyId'] || row['Party Name'] || '').toString().trim();
                const partyId = partyRef ? partyByNameOrAbbr.get(partyRef.toLowerCase()) : undefined;

                // Resolve Religion (O(1) Map lookup)
                const relRef = (row['Religion'] || row['religionName'] || row['religionId'] || '').toString().trim();
                const religionId = relRef ? religionByNameOrId.get(relRef.toLowerCase()) : undefined;

                // Resolve Caste (O(1) Map lookup)
                const casteRef = (row['Caste'] || row['Cast'] || row['casteName'] || row['casteId'] || '').toString().trim();
                const casteId = casteRef ? casteByNameOrId.get(casteRef.toLowerCase()) : undefined;

                // Parse Serial & Section
                const serialNo = row['Serial No'] || row['SerialNo'] || row['serialNo'] ? Number(row['Serial No'] || row['SerialNo'] || row['serialNo']) : undefined;
                const sectionNo = row['Section No'] || row['SectionNo'] || row['sectionNo'] ? Number(row['Section No'] || row['SectionNo'] || row['sectionNo']) : undefined;

                // Parse DOB & Age
                const rawDob = row['DOB'] || row['DateOfBirth(dd-MM-yyyy)'] || row['Date Of Birth'] || row['dob'] || undefined;
                const formattedDob = rawDob ? formatDateForDb(rawDob) || undefined : undefined;
                const calculatedAge = rawDob ? calculateAge(rawDob) : null;
                const manualAge = row['Age'] || row['age'] ? Number(row['Age'] || row['age']) : undefined;
                const finalAge = calculatedAge ?? (manualAge && !isNaN(manualAge) ? manualAge : undefined);

                // Standardize Gender
                const rawGender = (row['Gender'] || row['gender'] || '').toString().trim();
                const gender = /^(m|male)$/i.test(rawGender)
                  ? 'Male'
                  : /^(f|female)$/i.test(rawGender)
                    ? 'Female'
                    : (rawGender || undefined);

                // Sanitize Mobile & Email
                const rawMobile = (row['Mobile No'] || row['MobileNo*'] || row['MobileNo'] || row['mobileNo'] || '').toString().trim().replace(/[\s-]/g, '');
                const mobileNo = rawMobile || undefined;

                const rawEmail = (row['Email'] || row['email'] || '').toString().trim();
                const email = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : undefined;

                // Status & Flags
                const status = (row['Status'] || row['status'] || 'ACTIVE').toString().trim().toUpperCase();
                const isDead = parseBool(row['Is Dead'] || row['isDead'] || row['IsDead']);
                const isFamilyInfluencer = parseBool(row['Is Family Influencer'] || row['isFamilyInfluencer'] || row['IsFamilyInfluencer']);
                const isSocialInfluencer = parseBool(row['Is Social Influencer'] || row['isSocialInfluencer'] || row['IsSocialInfluencer']);
                const bloodGroup = (row['Blood Group'] || row['bloodGroup'] || row['BloodGroup'] || '').toString().trim() || undefined;

                // Address fields
                const taluka = (row['Taluka'] || row['taluka'] || '').toString().trim() || undefined;
                const village = (row['Village'] || row['village'] || '').toString().trim() || undefined;
                const fullAddress = (row['Full Address'] || row['fullAddress'] || row['FullAddress'] || '').toString().trim() || undefined;
                const voterAddress = (row['Voter Address'] || row['voterAddress'] || row['VoterAddress'] || '').toString().trim() || undefined;

                votersToInsert.push({
                  epicNo,
                  stateId,
                  districtId,
                  pcId,
                  acId,
                  boothId,
                  religionId,
                  casteId,
                  partyId,
                  serialNo,
                  houseNo: (() => {
                    const h = row['House No'] || row['HouseNo'] || row['houseNo'] || row['makan'];
                    if (h === undefined || h === null) return undefined;
                    const cleaned = String(h).replace(/[\u0ACD\u0AB0\u0A81-\u0A83\u0ABC\u0ABE-\u0AC9\u0ACD\u0AE2\u0AE3]/g, '').trim();
                    return cleaned || String(h).trim();
                  })(),
                  engFirstName: row['First Name (Eng)'] || row['EngFname'] || row['Eng Fname'] || row['engFirstName'] || undefined,
                  engMiddleName: row['Middle Name (Eng)'] || row['EngMname'] || row['Eng Mname'] || row['engMiddleName'] || undefined,
                  engSurname: row['Surname (Eng)'] || row['EngSname'] || row['Eng Sname'] || row['engSurname'] || undefined,
                  firstName: row['First Name (Local)'] || row['FName'] || row['Fname'] || row['firstName'] || undefined,
                  middleName: row['Middle Name (Local)'] || row['MName'] || row['Mname'] || row['middleName'] || undefined,
                  surname: row['Surname (Local)'] || row['SName'] || row['Sname'] || row['surname'] || undefined,
                  relation: (row['Relation'] || row['relation'] || '').toString().trim() || undefined,
                  guardianName: (row['Guardian Name'] || row['GuardianName'] || row['Father Name'] || row['FatherName'] || row['guardianName'] || row['guardian_name'] || '').toString().trim() || undefined,
                  gender,
                  dob: formattedDob,
                  age: finalAge,
                  mobileNo,
                  email,
                  aadhaarNo: (row['Aadhaar No'] || row['AdharNo'] || row['aadhaarNo'] || '').toString().trim() || undefined,
                  panNo: (row['PAN No'] || row['PanNo'] || row['panNo'] || '').toString().trim().toUpperCase() || undefined,
                  professionType: row['Profession Type'] || row['ProfessionType'] || row['professionType'] || undefined,
                  profession: row['Profession'] || row['profession'] || undefined,
                  subcasteName: row['Subcaste'] || row['SubCast'] || row['subcasteName'] || undefined,
                  voterType: row['Voter Type'] || row['VoterType'] || row['voterType'] || 'Voter',
                  status,
                  isDead,
                  bloodGroup,
                  taluka,
                  village,
                  fullAddress,
                  voterAddress,
                  isFamilyInfluencer,
                  isSocialInfluencer,
                });
              }

              const batchRes = await VoterQueries.createVotersBatch(votersToInsert);

              // Auto-propagate imported voter batch chunk to active scoped tenants for those ACs
              try {
                const votersByAc = new Map<string, any[]>();
                for (const v of votersToInsert) {
                  if (v.acId) {
                    if (!votersByAc.has(v.acId)) votersByAc.set(v.acId, []);
                    votersByAc.get(v.acId)!.push(v);
                  }
                }

                const { MasterBroadcastSync } = await import('../sync/masterBroadcastSync.service');
                for (const [acId, acVoters] of votersByAc.entries()) {
                  const rowsToBroadcast = acVoters.map((v) => ({
                    epic_no: v.epicNo,
                    state_id: v.stateId || null,
                    district_id: v.districtId || null,
                    pc_id: v.pcId || null,
                    ac_id: v.acId,
                    booth_id: v.boothId || null,
                    serial_no: v.serialNo || null,
                    section_no: v.sectionNo || null,
                    house_no: v.houseNo || null,
                    first_name: v.firstName || null,
                    eng_first_name: v.engFirstName || null,
                    middle_name: v.middleName || null,
                    eng_middle_name: v.engMiddleName || null,
                    surname: v.surname || null,
                    eng_surname: v.engSurname || null,
                    relation: v.relation || null,
                    guardian_name: v.guardianName || null,
                    gender: v.gender || null,
                    dob: v.dob || null,
                    age: v.age || null,
                    mobile_no: v.mobileNo || null,
                    email: v.email || null,
                    aadhaar_no: v.aadhaarNo || null,
                    pan_no: v.panNo || null,
                    profession_type: v.professionType || null,
                    profession: v.profession || null,
                    religion_id: v.religionId || null,
                    caste_id: v.casteId || null,
                    subcaste_name: v.subcasteName || null,
                    voter_type: v.voterType || 'Voter',
                    status: v.status || 'Active',
                    is_dead: v.isDead ?? false,
                    blood_group: v.bloodGroup || null,
                    taluka: v.taluka || null,
                    village: v.village || null,
                    full_address: v.fullAddress || null,
                    voter_address: v.voterAddress || null,
                    party_id: v.partyId || null,
                    is_family_influencer: v.isFamilyInfluencer ?? false,
                    is_social_influencer: v.isSocialInfluencer ?? false,
                  }));

                  await MasterBroadcastSync.broadcastBatchToScopedTenants('voters', rowsToBroadcast, acId, 'epic_no');
                }
              } catch (broadcastErr: any) {
                logger.warn(`[MasterBulkService] Failed to broadcast imported voters to scoped tenants: ${broadcastErr.message}`);
              }

              // Auto-trigger family mapping for all affected booths post-import
              const uniqueBoothIds = Array.from(new Set(votersToInsert.map((v) => v.boothId).filter(Boolean))) as string[];
              for (const bId of uniqueBoothIds) {
                try {
                  await FamilyMappingService.autoMapBoothFamilies({ boothId: bId });
                } catch (mapErr: any) {
                  logger.warn(`[MasterBulkService] Post-import auto family mapping for booth ${bId} encountered error: ${mapErr.message}`);
                }
              }

              return batchRes.inserted;
            },
          });
          break;
        }

        default:
          throw new Error(`Unsupported master category for bulk import: '${category}'`);
      }

      importJobTracker.completeJob(jobId, result.insertedCount, result.failedCount);
    } catch (err: any) {
      logger.error(`[MasterBulkService] Background import job ${jobId} failed:`, err);
      importJobTracker.failJob(jobId, err.message || 'Bulk import processing error');
    }
  }

  /**
   * Return pre-formatted human-readable sample CSV text for any master category pre-populated with actual DB labels
   */
  static async getSampleCsvTemplate(category: string): Promise<string> {
    const cat = category.toLowerCase();

    if (cat === 'religions') {
      return 'name\nHinduism\nIslam\nChristianity\nSikhism\nBuddhism\nJainism';
    }

    if (cat === 'castes') {
      const religions = await MasterQueries.getReligions();
      const r1 = religions[0]?.name || 'Hinduism';
      const r2 = religions[1]?.name || 'Islam';
      return `name,category,religionName\nBrahmin,General,${r1}\nRajput,General,${r1}\nYadav,OBC,${r2}\nJat,OBC,${r2}`;
    }

    if (cat === 'states') {
      return 'name\nMaharashtra\nUttar Pradesh\nBihar\nGujarat\nGoa';
    }

    if (cat === 'districts') {
      const states = await MasterQueries.getStates();
      const s1 = states[0]?.name || 'Maharashtra';
      const s2 = states[1]?.name || 'Uttar Pradesh';
      return `name,stateName\nNagpur,${s1}\nPune,${s1}\nLucknow,${s2}\nPatna,${s2}`;
    }

    if (cat === 'talukas' || cat === 'taluka') {
      const states = await MasterQueries.getStates();
      const districts = await MasterQueries.getDistricts();
      const s1 = states[0]?.name || 'Maharashtra';
      const d1 = districts[0]?.name || 'Pune';
      return `State Name,District Name,Taluka Name\n${s1},${d1},Haveli\n${s1},${d1},Khed\n${s1},${d1},Shirur`;
    }

    if (cat === 'villages' || cat === 'village') {
      const districts = await MasterQueries.getDistricts();
      const talukas = await MasterQueries.getTalukas();
      const d1 = districts[0]?.name || 'Pune';
      const t1 = talukas[0]?.name || 'Haveli';
      return `District Name,Taluka Name,Village Name\n${d1},${t1},Wagholi\n${d1},${t1},Kothrud`;
    }

    if (cat === 'pcs' || cat === 'parliamentary_constituencies') {
      const states = await MasterQueries.getStates();
      const s1 = states[0]?.name || 'Maharashtra';
      const s2 = states[1]?.name || 'Uttar Pradesh';
      return `pcNumber,name,stateName\n1,Nagpur,${s1}\n2,Ramtek,${s1}\n3,Varanasi,${s2}`;
    }

    if (cat === 'acs' || cat === 'assembly_constituencies') {
      const pcs = await MasterQueries.getPcs();
      const districts = await MasterQueries.getDistricts();
      const pc1 = pcs[0]?.name || 'Nagpur';
      const d1 = districts[0]?.name || 'Nagpur';
      return `acNumber,name,pcName,districtName\n52,Nagpur South West,${pc1},${d1}\n53,Nagpur South,${pc1},${d1}\n54,Nagpur East,${pc1},${d1}`;
    }

    if (cat === 'booths' || cat === 'polling_booths') {
      const acs = await MasterQueries.getAcs();
      const ac1 = acs[0]?.name || 'Nagpur South West';
      return `boothNumber,name,acName,locationBuilding,totalVoters\n1,Zilla Parishad Primary School Room 1,${ac1},Z.P. School,850\n2,Zilla Parishad Primary School Room 2,${ac1},Z.P. School,920`;
    }

    if (cat === 'parties' || cat === 'political_parties') {
      return 'name,abbreviation,symbolLogo\nBharatiya Janata Party,BJP,/uploads/parties/bjp.png\nIndian National Congress,INC,/uploads/parties/inc.png\nAam Aadmi Party,AAP,/uploads/parties/aap.png';
    }



    if (cat === 'voters') {
      const booths = await MasterQueries.getBooths();
      const b1 = booths[0]?.name || '1';
      return `Select Booth,SerialNo,SectionNo,HouseNo,EngFname,EngMname,EngSname,FName,MName,SName,IdCardNo,Gender,DateOfBirth(dd-MM-yyyy),MobileNo*,Email,AdharNo,PanNo,ProfessionType,Profession,Cast,SubCast,Religion,VoterType\n${b1},1,1,12/B,Rajesh,Kumar,Sharma,राजेश,कुमार,शर्मा,ABC1234567,Male,15-08-1985,9876543210,rajesh@example.com,123456789012,ABCDE1234F,Business,Shopkeeper,Brahmin,Kanyakubj,Hinduism,Voter`;
    }

    return 'name\nSample Entry 1\nSample Entry 2';
  }

  /**
   * Return pre-formatted human-readable sample Excel Buffer for any master category
   * pre-populated with actual DB labels and native Excel in-cell select dropdown options
   */
  /**
   * Return pre-formatted human-readable sample Excel Buffer for any master category
   * pre-populated with actual DB labels and native Excel in-cell select dropdown options.
   * Supports both generic mode (no queryParams) and scoped mode (queryParams provided).
   */
  static async getSampleExcelTemplate(category: string, queryParams: Record<string, any> = {}): Promise<Buffer> {
    const cat = category.toLowerCase().trim();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ranniti';
    workbook.lastModifiedBy = 'Ranniti System';

    const sheet = workbook.addWorksheet('Sample Template');

    // Create hidden sheet for dynamic dropdown lists if needed
    let lookupSheet: ExcelJS.Worksheet | null = null;
    let nextLookupColIndex = 1;

    const getLookupSheet = () => {
      if (!lookupSheet) {
        lookupSheet = workbook.addWorksheet('DropdownData');
        lookupSheet.state = 'hidden';
      }
      return lookupSheet;
    };

    // Helper to format column index (1 -> A, 2 -> B, 27 -> AA, etc.)
    function getColumnLetter(colIndex: number): string {
      let temp: number;
      let letter = '';
      let index = colIndex;
      while (index > 0) {
        temp = (index - 1) % 26;
        letter = String.fromCharCode(65 + temp) + letter;
        index = Math.floor((index - temp) / 26);
      }
      return letter;
    }

    // Helper to add data validation dropdown for cells in a column across rows 2..1000
    const addListValidation = (colLetter: string, formula: string) => {
      for (let r = 2; r <= 1000; r++) {
        const cell = sheet.getCell(`${colLetter}${r}`);
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formula],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid option from the dropdown list.',
        };
      }
    };

    // Helper to register dynamic DB values on hidden sheet and return range formula
    const registerDynamicLookup = (colName: string, items: string[]): string => {
      const colIdx = nextLookupColIndex++;
      const lSheet = getLookupSheet();
      lSheet.getCell(1, colIdx).value = colName;
      const cleanItems = Array.from(new Set(items.map((i) => (i ? String(i).trim() : '')).filter(Boolean)));
      const listToUse = cleanItems.length > 0 ? cleanItems : ['Sample Entry'];

      listToUse.forEach((item, idx) => {
        lSheet.getCell(idx + 2, colIdx).value = item;
      });

      const colLetter = getColumnLetter(colIdx);
      const endRow = listToUse.length + 1;
      return `DropdownData!$${colLetter}$2:$${colLetter}$${endRow}`;
    };

    // Category-specific targeted query execution and template construction
    if (cat === 'voters' || cat === 'voter') {
      const { acId, boothId } = queryParams;
      const [religions, castes, parties, talukas, villages, booths] = await Promise.all([
        MasterQueries.getReligions().catch(() => []),
        MasterQueries.getCastes().catch(() => []),
        MasterQueries.getParties().catch(() => []),
        MasterQueries.getTalukas(queryParams.districtId).catch(() => []),
        MasterQueries.getVillages(queryParams.talukaId).catch(() => []),
        acId || boothId
          ? MasterQueries.getBooths({ acId: acId as string, limit: 100 }).catch(() => [])
          : MasterQueries.getBooths({ limit: 50 }).catch(() => []),
      ]);

      const religionNames = religions.map((r) => r.name);
      const parentCastes = castes.filter((c) => !c.parentCasteId);
      const subCastes = castes.filter((c) => Boolean(c.parentCasteId));
      const casteNames = (parentCastes.length > 0 ? parentCastes : castes).map((c) => c.name);
      const subcasteNames = subCastes.length > 0 ? subCastes.map((c) => c.name) : ['Kanyakubj', 'Deshastha', 'Kokanastha', 'Kunbi Maratha', 'Chitpavan'];
      const partyNames = parties.length > 0 ? parties.map((p) => p.name) : ['Bharatiya Janata Party', 'Indian National Congress', 'Aam Aadmi Party'];
      const talukaNames = talukas.length > 0 ? talukas.map((t) => t.name) : ['Haveli', 'Karjat', 'Shirur', 'Baramati'];
      const villageNames = villages.length > 0 ? (villages as any[]).map((v: any) => v.name) : ['Wagholi', 'Kothrud', 'Hadapsar', 'Bavdhan'];
      const boothList = Array.isArray(booths) ? booths : (booths as any)?.booths || [];
      const boothNames = boothList.map((b: any) => b.name);

      const headers = [
        'Select Booth', 'SerialNo', 'SectionNo', 'HouseNo',
        'EngFname', 'EngMname', 'EngSname', 'FName', 'MName', 'SName',
        'IdCardNo', 'Gender', 'DateOfBirth(dd-MM-yyyy)', 'MobileNo*', 'Email',
        'AdharNo', 'PanNo', 'ProfessionType', 'Profession',
        'Cast', 'SubCast', 'Religion', 'Party', 'Taluka', 'Village',
        'VoterType', 'Status', 'Is Dead', 'Is Family Influencer', 'Is Social Influencer', 'Blood Group',
      ];
      sheet.addRow(headers);

      const b1 = boothNames[0] || 'Zilla Parishad Primary School Room 1';
      const r1 = religionNames[0] || 'Hinduism';
      const c1 = casteNames[0] || 'Brahmin';
      const sc1 = subcasteNames[0] || 'Kanyakubj';
      const p1 = partyNames[0] || 'Bharatiya Janata Party';
      const t1 = talukaNames[0] || 'Haveli';
      const v1 = villageNames[0] || 'Wagholi';

      sheet.addRow([
        b1, 1, 1, '12/B',
        'Rajesh', 'Kumar', 'Sharma', 'राजेश', 'कुमार', 'शर्मा',
        'ABC1234567', 'Male', '15-08-1985', '9876543210', 'rajesh@example.com',
        '123456789012', 'ABCDE1234F', 'Business', 'Shopkeeper',
        c1, sc1, r1, p1, t1, v1,
        'Voter', 'ACTIVE', 'No', 'No', 'No', 'B+',
      ]);

      const boothFormula = registerDynamicLookup('Booths', boothNames);
      addListValidation('A', boothFormula);
      addListValidation('L', '"Male,Female,Other"');

      for (let r = 2; r <= 1000; r++) {
        const cell = sheet.getCell(`M${r}`);
        cell.numFmt = 'dd-mm-yyyy';
        cell.dataValidation = {
          type: 'date',
          operator: 'between',
          formulae: [new Date('1900-01-01'), new Date('2099-12-31')],
          showErrorMessage: true,
          errorTitle: 'Invalid Date',
          error: 'Please enter or select a valid date in DD-MM-YYYY format.',
        };
      }

      addListValidation('R', '"Business,Service,Agriculture,Student,Housewife,Self-Employed,Unemployed,Professional,Other"');
      addListValidation('T', registerDynamicLookup('Castes', casteNames));
      addListValidation('U', registerDynamicLookup('Subcastes', subcasteNames));
      addListValidation('V', registerDynamicLookup('Religions', religionNames));
      addListValidation('W', registerDynamicLookup('Parties', partyNames));
      addListValidation('X', registerDynamicLookup('Talukas', talukaNames));
      addListValidation('Y', registerDynamicLookup('Villages', villageNames));
      addListValidation('Z', '"Voter,Neutral Voter,Non Voter,Student,Senior,NRI,VIP"');
      addListValidation('AA', '"ACTIVE,INACTIVE,SHIFTED,UNVERIFIED,PENDING"');
      addListValidation('AB', '"Yes,No"');
      addListValidation('AC', '"Yes,No"');
      addListValidation('AD', '"Yes,No"');
      addListValidation('AE', '"A+,A-,B+,B-,AB+,AB-,O+,O-"');

    } else if (cat === 'castes' || cat === 'caste') {
      const religions = await MasterQueries.getReligions().catch(() => []);
      const religionNames = religions.map((r) => r.name);
      sheet.addRow(['name', 'category', 'religionName']);
      const r1 = religionNames[0] || 'Hinduism';
      sheet.addRow(['Brahmin', 'General', r1]);

      addListValidation('B', '"General,OBC,SC,ST,Other"');
      const religionFormula = registerDynamicLookup('Religions', religionNames);
      addListValidation('C', religionFormula);

    } else if (cat === 'religions' || cat === 'religion') {
      sheet.addRow(['name']);
      sheet.addRow(['Hinduism']);
      sheet.addRow(['Islam']);
      sheet.addRow(['Christianity']);
      sheet.addRow(['Sikhism']);
      sheet.addRow(['Buddhism']);
      sheet.addRow(['Jainism']);

    } else if (cat === 'states' || cat === 'state') {
      sheet.addRow(['name']);
      sheet.addRow(['Maharashtra']);
      sheet.addRow(['Uttar Pradesh']);
      sheet.addRow(['Karnataka']);
      sheet.addRow(['Gujarat']);

    } else if (cat === 'districts' || cat === 'district') {
      const states = await MasterQueries.getStates().catch(() => []);
      let stateNames = states.map((s) => s.name);
      let defaultState = stateNames[0] || 'Maharashtra';

      if (queryParams.stateId) {
        const matched = states.find((s) => String(s.id).toLowerCase() === String(queryParams.stateId).toLowerCase());
        if (matched) {
          defaultState = matched.name;
          stateNames = [matched.name, ...stateNames.filter((n) => n !== matched.name)];
        }
      }

      sheet.addRow(['name', 'stateName']);
      sheet.addRow(['Nagpur', defaultState]);
      sheet.addRow(['Pune', defaultState]);

      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('B', stateFormula);

    } else if (cat === 'pcs' || cat === 'pc' || cat === 'parliamentary_constituencies' || cat === 'parliamentary_constituency') {
      const states = await MasterQueries.getStates().catch(() => []);
      let stateNames = states.map((s) => s.name);
      let defaultState = stateNames[0] || 'Maharashtra';

      if (queryParams.stateId) {
        const matched = states.find((s) => String(s.id).toLowerCase() === String(queryParams.stateId).toLowerCase());
        if (matched) {
          defaultState = matched.name;
          stateNames = [matched.name, ...stateNames.filter((n) => n !== matched.name)];
        }
      }

      sheet.addRow(['pcNumber', 'name', 'stateName']);
      sheet.addRow([1, 'Nagpur', defaultState]);
      sheet.addRow([2, 'Ramtek', defaultState]);

      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('C', stateFormula);

    } else if (cat === 'acs' || cat === 'ac' || cat === 'assembly_constituencies' || cat === 'assembly_constituency') {
      const [pcs, districts] = await Promise.all([
        MasterQueries.getPcs().catch(() => []),
        MasterQueries.getDistricts(queryParams.stateId).catch(() => []),
      ]);

      let pcNames = pcs.map((p) => p.name);
      let districtNames = districts.map((d) => d.name);
      let defaultPc = pcNames[0] || 'Nagpur';
      let defaultDistrict = districtNames[0] || 'Nagpur';

      if (queryParams.pcId) {
        const matchedPc = pcs.find((p) => String(p.id).toLowerCase() === String(queryParams.pcId).toLowerCase());
        if (matchedPc) {
          defaultPc = matchedPc.name;
          pcNames = [matchedPc.name, ...pcNames.filter((n) => n !== matchedPc.name)];
        }
      }

      if (queryParams.districtId) {
        const matchedDist = districts.find((d) => String(d.id).toLowerCase() === String(queryParams.districtId).toLowerCase());
        if (matchedDist) {
          defaultDistrict = matchedDist.name;
          districtNames = [matchedDist.name, ...districtNames.filter((n) => n !== matchedDist.name)];
        }
      }

      sheet.addRow(['acNumber', 'name', 'pcName', 'districtName']);
      sheet.addRow([52, 'Nagpur South West', defaultPc, defaultDistrict]);
      sheet.addRow([53, 'Nagpur South', defaultPc, defaultDistrict]);

      const pcFormula = registerDynamicLookup('PCs', pcNames);
      addListValidation('C', pcFormula);

      const distFormula = registerDynamicLookup('Districts', districtNames);
      addListValidation('D', distFormula);

    } else if (cat === 'talukas' || cat === 'taluka') {
      const [districts, states] = await Promise.all([
        MasterQueries.getDistricts(queryParams.stateId).catch(() => []),
        MasterQueries.getStates().catch(() => []),
      ]);

      let districtNames = districts.map((d) => d.name);
      let stateNames = states.map((s) => s.name);
      let defaultDistrict = districtNames[0] || 'Pune';
      let defaultState = stateNames[0] || 'Maharashtra';

      if (queryParams.districtId) {
        const matchedDist = districts.find((d) => String(d.id).toLowerCase() === String(queryParams.districtId).toLowerCase());
        if (matchedDist) {
          defaultDistrict = matchedDist.name;
          districtNames = [matchedDist.name, ...districtNames.filter((n) => n !== matchedDist.name)];
          if (matchedDist.stateName) {
            defaultState = matchedDist.stateName;
          }
        }
      } else if (queryParams.stateId) {
        const matchedState = states.find((s) => String(s.id).toLowerCase() === String(queryParams.stateId).toLowerCase());
        if (matchedState) {
          defaultState = matchedState.name;
          stateNames = [matchedState.name, ...stateNames.filter((n) => n !== matchedState.name)];
        }
      }

      sheet.addRow(['name', 'districtName', 'stateName']);
      sheet.addRow(['Haveli', defaultDistrict, defaultState]);
      sheet.addRow(['Baramati', defaultDistrict, defaultState]);

      const distFormula = registerDynamicLookup('Districts', districtNames);
      addListValidation('B', distFormula);

      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('C', stateFormula);

    } else if (cat === 'villages' || cat === 'village') {
      const [talukas, districts] = await Promise.all([
        MasterQueries.getTalukas(queryParams.districtId).catch(() => []),
        MasterQueries.getDistricts(queryParams.stateId).catch(() => []),
      ]);

      let talukaNames = talukas.map((t) => t.name);
      let districtNames = districts.map((d) => d.name);
      let defaultTaluka = talukaNames[0] || 'Haveli';
      let defaultDistrict = districtNames[0] || 'Pune';

      if (queryParams.talukaId) {
        const matchedTaluka = talukas.find((t) => String(t.id).toLowerCase() === String(queryParams.talukaId).toLowerCase());
        if (matchedTaluka) {
          defaultTaluka = matchedTaluka.name;
          talukaNames = [matchedTaluka.name, ...talukaNames.filter((n) => n !== matchedTaluka.name)];
          if (matchedTaluka.districtName) {
            defaultDistrict = matchedTaluka.districtName;
          }
        }
      }

      if (queryParams.districtId && !queryParams.talukaId) {
        const matchedDist = districts.find((d) => String(d.id).toLowerCase() === String(queryParams.districtId).toLowerCase());
        if (matchedDist) {
          defaultDistrict = matchedDist.name;
          districtNames = [matchedDist.name, ...districtNames.filter((n) => n !== matchedDist.name)];
        }
      }

      sheet.addRow(['name', 'talukaName', 'districtName']);
      sheet.addRow(['Wagholi', defaultTaluka, defaultDistrict]);
      sheet.addRow(['Kothrud', defaultTaluka, defaultDistrict]);

      const talukaFormula = registerDynamicLookup('Talukas', talukaNames);
      addListValidation('B', talukaFormula);

      const distFormula = registerDynamicLookup('Districts', districtNames);
      addListValidation('C', distFormula);

    } else if (cat === 'wards' || cat === 'ward') {
      const acs = await MasterQueries.getAcs(queryParams.pcId as string, queryParams.districtId as string, queryParams.stateId as string).catch(() => []);
      let acNames = acs.map((a) => a.name);
      let defaultAc = acNames[0] || 'Nagpur South West';

      if (queryParams.acId) {
        const matchedAc = acs.find((a) => String(a.id).toLowerCase() === String(queryParams.acId).toLowerCase());
        if (matchedAc) {
          defaultAc = matchedAc.name;
          acNames = [matchedAc.name, ...acNames.filter((n) => n !== matchedAc.name)];
        }
      }

      sheet.addRow(['wardNumber', 'name', 'acName']);
      sheet.addRow([1, 'Ward No. 1', defaultAc]);
      sheet.addRow([2, 'Ward No. 2', defaultAc]);

      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);

    } else if (cat === 'booths' || cat === 'booth' || cat === 'polling_booths' || cat === 'polling_booth') {
      const [acs, wards] = await Promise.all([
        MasterQueries.getAcs(queryParams.pcId as string, queryParams.districtId as string, queryParams.stateId as string).catch(() => []),
        queryParams.acId
          ? MasterQueries.getWards(queryParams.acId as string).catch(() => [])
          : MasterQueries.getWards().catch(() => []),
      ]);

      let acNames = acs.map((a) => a.name);
      let defaultAc = acNames[0] || 'Nagpur South West';

      if (queryParams.acId) {
        const matchedAc = acs.find((a) => String(a.id).toLowerCase() === String(queryParams.acId).toLowerCase());
        if (matchedAc) {
          defaultAc = matchedAc.name;
          acNames = [matchedAc.name, ...acNames.filter((n) => n !== matchedAc.name)];
        }
      }

      const wardList = Array.isArray(wards) ? wards : (wards as any)?.wards || [];
      const wardNames = wardList.map((w: any) => w.name);
      const defaultWard = wardNames[0] || 'Ward No. 1';

      sheet.addRow(['boothNumber', 'name', 'acName', 'wardName', 'locationBuilding', 'totalVoters']);
      sheet.addRow([1, 'Zilla Parishad Primary School Room 1', defaultAc, defaultWard, 'Z.P. School', 850]);
      sheet.addRow([2, 'Zilla Parishad Primary School Room 2', defaultAc, defaultWard, 'Z.P. School', 920]);

      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);

      if (wardNames.length > 0) {
        const wardFormula = registerDynamicLookup('Wards', wardNames);
        addListValidation('D', wardFormula);
      }

    } else if (cat === 'parties' || cat === 'party' || cat === 'political_parties' || cat === 'political_party') {
      sheet.addRow(['name', 'abbreviation', 'symbolLogo']);
      sheet.addRow(['Bharatiya Janata Party', 'BJP', '/uploads/parties/bjp.png']);
      sheet.addRow(['Indian National Congress', 'INC', '/uploads/parties/inc.png']);
      sheet.addRow(['Aam Aadmi Party', 'AAP', '/uploads/parties/aap.png']);

    } else {
      sheet.addRow(['name']);
      sheet.addRow(['Sample Entry 1']);
      sheet.addRow(['Sample Entry 2']);
    }

    // Header styling
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF1F2937' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    // Auto-fit column widths
    sheet.columns.forEach((col) => {
      let maxLen = 0;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      col.width = Math.max(maxLen + 5, 18);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}


