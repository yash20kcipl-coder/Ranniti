import ExcelJS from 'exceljs';
import { logger } from '../utils/logger';
import { BulkImporter } from '../utils/bulkImporter';
import { importJobTracker } from './importJobTracker';
import { VoterQueries } from '../queries/voter.queries';
import { MasterQueries } from '../queries/master.queries';
import { FamilyMappingService } from './familyMapping.service';
import { BatchInsertQuery } from '../queries/batchInsert.query';
import { calculateAge, formatDateForDb } from '../utils/dateUtils';

export class MasterBulkService {
  /**
   * Process asynchronous bulk import job in background with Name Resolution & Auto-Creation
   */
  static async processBulkImportJob(jobId: string, category: string, records: Record<string, any>[]): Promise<void> {
    try {
      logger.info(`[MasterBulkService] Starting background import job ${jobId} for category '${category}' (${records.length} records)`);

      const progressCallback = (p: { processed: number; inserted: number; failed: number }) => {
        importJobTracker.updateProgress(jobId, p.processed, p.inserted, p.failed);
      };

      let result;

      switch (category.toLowerCase()) {
        case 'religions': {
          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert = batch
                .map((row) => ({ name: (row.name || row.religionName || '').trim() }))
                .filter((r) => r.name.length > 0);
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'religions',
                rowsToInsert,
                ['name'],
                { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          break;
        }

        case 'castes': {
          const religions = await MasterQueries.getReligions().catch(() => []);
          const religionMap = new Map<string, string>();
          for (const r of religions) {
            religionMap.set(r.id.toLowerCase(), r.id);
            religionMap.set(r.name.toLowerCase().trim(), r.id);
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row.name || row.casteName || '').trim();
                const categoryName = (row.category || 'General').trim();
                const religionRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
                const religionId = religionMap.get(religionRef) || null;
                const parentCasteId = row.parentCasteId || row.parent_caste_id || null;

                if (name && categoryName) {
                  rowsToInsert.push({
                    name,
                    category: categoryName,
                    religion_id: religionId,
                    parent_caste_id: parentCasteId,
                  });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'castes',
                rowsToInsert,
                ['name', 'category', 'religion_id', 'parent_caste_id'],
                { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          break;
        }

        case 'states': {
          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert = batch
                .map((row) => ({ name: (row.name || row.stateName || '').trim() }))
                .filter((r) => r.name.length > 0);
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'states',
                rowsToInsert,
                ['name'],
                { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          break;
        }

        case 'districts': {
          const states = await MasterQueries.getStates().catch(() => []);
          const stateMap = new Map<string, string>();
          for (const s of states) {
            stateMap.set(s.id.toLowerCase(), s.id);
            stateMap.set(s.name.toLowerCase().trim(), s.id);
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row.name || row.districtName || '').trim();
                const stateRef = String(row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
                const stateId = stateMap.get(stateRef);

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
          break;
        }

        case 'pcs':
        case 'parliamentary_constituencies': {
          const states = await MasterQueries.getStates().catch(() => []);
          const stateMap = new Map<string, string>();
          for (const s of states) {
            stateMap.set(s.id.toLowerCase(), s.id);
            stateMap.set(s.name.toLowerCase().trim(), s.id);
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row.name || row.pcName || '').trim();
                const pcNum = Number(row.pcNumber || row.pc_number || 1);
                const stateRef = String(row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
                const stateId = stateMap.get(stateRef);

                if (name && stateId) {
                  rowsToInsert.push({ state_id: stateId, pc_number: pcNum, name });
                }
              }
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'parliamentary_constituencies',
                rowsToInsert,
                ['state_id', 'pc_number', 'name'],
                { conflictTarget: ['state_id', 'pc_number'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          break;
        }

        case 'acs':
        case 'assembly_constituencies': {
          const [pcs, districts] = await Promise.all([
            MasterQueries.getPcs().catch(() => []),
            MasterQueries.getDistricts().catch(() => []),
          ]);
          const pcMap = new Map<string, string>();
          for (const p of pcs) {
            pcMap.set(p.id.toLowerCase(), p.id);
            pcMap.set(p.name.toLowerCase().trim(), p.id);
          }
          const districtMap = new Map<string, string>();
          for (const d of districts) {
            districtMap.set(d.id.toLowerCase(), d.id);
            districtMap.set(d.name.toLowerCase().trim(), d.id);
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row.name || row.acName || '').trim();
                const acNum = Number(row.acNumber || row.ac_number || 1);
                const pcRef = String(row.pcName || row.pc || row.pcId || row.pc_id || '').toLowerCase().trim();
                const pcId = pcMap.get(pcRef);

                const districtRef = String(row.districtName || row.district || row.districtId || row.district_id || '').toLowerCase().trim();
                const districtId = districtMap.get(districtRef) || null;

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
                { conflictTarget: ['pc_id', 'ac_number'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          break;
        }

        case 'wards': {
          const acs = await MasterQueries.getAcs().catch(() => []);
          const acMap = new Map<string, string>();
          for (const a of acs) {
            acMap.set(a.id.toLowerCase(), a.id);
            acMap.set(a.name.toLowerCase().trim(), a.id);
          }

          result = await BulkImporter.processArray(records, {
            batchSize: 2500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              const rowsToInsert: any[] = [];
              for (const row of batch) {
                const name = (row.name || row.wardName || '').trim();
                const wardNum = Number(row.wardNumber || row.ward_number || 1);
                const acRef = String(row.acName || row.ac || row.acId || row.ac_id || '').toLowerCase().trim();
                const acId = acMap.get(acRef);

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
          break;
        }

        case 'booths':
        case 'polling_booths': {
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
                const name = (row.name || row.boothName || '').trim();
                const boothNum = Number(row.boothNumber || row.booth_number || 1);
                const acRef = String(row.acName || row.ac || row.acId || row.ac_id || '').toLowerCase().trim();
                const acId = acMap.get(acRef);

                const wardRef = String(row.wardName || row.ward || row.wardId || row.ward_id || '').toLowerCase().trim();
                const wardId = wardMap.get(wardRef) || (acId && row.wardNumber ? wardMap.get(`${acId}_${row.wardNumber}`.toLowerCase()) : null);

                if (name && acId) {
                  rowsToInsert.push({
                    ac_id: acId,
                    ward_id: wardId || null,
                    booth_number: boothNum,
                    name,
                    location_building: row.locationBuilding || row.location_building || null,
                    total_voters: Number(row.totalVoters || row.total_voters || 0),
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
          break;
        }

        case 'parties':
        case 'political_parties': {
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
              if (rowsToInsert.length === 0) return 0;
              const res = await BatchInsertQuery.executeBatchImport(
                'parties',
                rowsToInsert,
                ['name', 'abbreviation', 'symbol_logo'],
                { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
              );
              return res.insertedCount;
            },
          });
          break;
        }

        case 'voters': {
          const { VoterQueries } = await import('../queries/voter.queries');
          const { MasterQueries } = await import('../queries/master.queries');

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

          // Build O(1) lookup maps for religion, caste, and party
          const religionByNameOrId = new Map<string, string>();
          for (const r of religions) {
            religionByNameOrId.set(r.id.toLowerCase(), r.id);
            religionByNameOrId.set(r.name.toLowerCase().trim(), r.id);
          }

          const casteByNameOrId = new Map<string, string>();
          for (const c of castes) {
            casteByNameOrId.set(c.id.toLowerCase(), c.id);
            casteByNameOrId.set(c.name.toLowerCase().trim(), c.id);
          }

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
                  ''
                ).toString().trim();
                const boothNumRef = row['Booth No'] || row['boothNumber'] || row['boothNo'];

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
                const acRef = (row['AC Name'] || row['acName'] || row['acId'] || '').toString().trim();
                if (!acId && acRef) {
                  const foundAc = acById.get(acRef) || acByName.get(acRef.toLowerCase());
                  if (foundAc) acId = foundAc.id;
                }

                let pcId: string | undefined = undefined;
                const pcRef = (row['PC Name'] || row['pcName'] || row['pcId'] || '').toString().trim();
                if (acId) {
                  const parentAc = acById.get(acId);
                  if (parentAc?.pcId) pcId = parentAc.pcId;
                }
                if (!pcId && pcRef) {
                  const foundPc = pcById.get(pcRef) || pcByName.get(pcRef.toLowerCase());
                  if (foundPc) pcId = foundPc.id;
                }

                let districtId: string | undefined = undefined;
                const distRef = (row['District Name'] || row['districtName'] || row['districtId'] || '').toString().trim();
                if (acId) {
                  const parentAc = acById.get(acId);
                  if (parentAc?.districtId) districtId = parentAc.districtId;
                }
                if (!districtId && distRef) {
                  const foundDist = distById.get(distRef) || distByName.get(distRef.toLowerCase());
                  if (foundDist) districtId = foundDist.id;
                }

                let stateId: string | undefined = undefined;
                const stateRef = (row['State Name'] || row['stateName'] || row['stateId'] || '').toString().trim();
                if (districtId) {
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
                  sectionNo,
                  houseNo: row['House No'] || row['HouseNo'] || row['houseNo'] || undefined,
                  engFirstName: row['First Name (Eng)'] || row['EngFname'] || row['Eng Fname'] || row['engFirstName'] || undefined,
                  engMiddleName: row['Middle Name (Eng)'] || row['EngMname'] || row['Eng Mname'] || row['engMiddleName'] || undefined,
                  engSurname: row['Surname (Eng)'] || row['EngSname'] || row['Eng Sname'] || row['engSurname'] || undefined,
                  firstName: row['First Name (Local)'] || row['FName'] || row['Fname'] || row['firstName'] || undefined,
                  middleName: row['Middle Name (Local)'] || row['MName'] || row['Mname'] || row['middleName'] || undefined,
                  surname: row['Surname (Local)'] || row['SName'] || row['Sname'] || row['surname'] || undefined,
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
  static async getSampleExcelTemplate(category: string): Promise<Buffer> {
    const cat = category.toLowerCase();
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

    // Fetch dynamic options from DB
    const [religions, castes, states, districts, pcs, acs, booths, talukas, villages, parties] = await Promise.all([
      MasterQueries.getReligions().catch(() => []),
      MasterQueries.getCastes().catch(() => []),
      MasterQueries.getStates().catch(() => []),
      MasterQueries.getDistricts().catch(() => []),
      MasterQueries.getPcs().catch(() => []),
      MasterQueries.getAcs().catch(() => []),
      MasterQueries.getBooths().catch(() => []),
      MasterQueries.getTalukas().catch(() => []),
      MasterQueries.getVillages().catch(() => []),
      MasterQueries.getParties().catch(() => []),
    ]);

    const religionNames = religions.map((r) => r.name);
    const parentCastes = castes.filter((c) => !c.parentCasteId);
    const subCastes = castes.filter((c) => Boolean(c.parentCasteId));

    const casteNames = (parentCastes.length > 0 ? parentCastes : castes).map((c) => c.name);
    const subcasteNames = subCastes.length > 0 ? subCastes.map((c) => c.name) : ['Kanyakubj', 'Deshastha', 'Kokanastha', 'Kunbi Maratha', 'Chitpavan'];
    const stateNames = states.map((s) => s.name);
    const districtNames = districts.map((d) => d.name);
    const pcNames = pcs.map((p) => p.name);
    const acNames = acs.map((a) => a.name);
    const boothNames = booths.map((b) => b.name);
    const talukaNames = talukas.length > 0 ? talukas.map((t) => t.name) : ['Haveli', 'Karjat', 'Shirur', 'Baramati'];
    const villageNames = villages.length > 0 ? villages.map((v) => v.name) : ['Wagholi', 'Kothrud', 'Hadapsar', 'Bavdhan'];
    const partyNames = parties.length > 0 ? parties.map((p) => p.name) : ['Bharatiya Janata Party', 'Indian National Congress', 'Aam Aadmi Party'];

    if (cat === 'voters') {
      const headers = [
        'Select Booth',
        'SerialNo',
        'SectionNo',
        'HouseNo',
        'EngFname',
        'EngMname',
        'EngSname',
        'FName',
        'MName',
        'SName',
        'IdCardNo',
        'Gender',
        'DateOfBirth(dd-MM-yyyy)',
        'MobileNo*',
        'Email',
        'AdharNo',
        'PanNo',
        'ProfessionType',
        'Profession',
        'Cast',
        'SubCast',
        'Religion',
        'Party',
        'Taluka',
        'Village',
        'VoterType',
        'Status',
        'Is Dead',
        'Is Family Influencer',
        'Is Social Influencer',
        'Blood Group',
      ];
      sheet.addRow(headers);

      // Sample Row 2
      const b1 = boothNames[0] || 'Zilla Parishad Primary School Room 1';
      const r1 = religionNames[0] || 'Hinduism';
      const c1 = casteNames[0] || 'Brahmin';
      const sc1 = subcasteNames[0] || 'Kanyakubj';
      const p1 = partyNames[0] || 'Bharatiya Janata Party';
      const t1 = talukaNames[0] || 'Haveli';
      const v1 = villageNames[0] || 'Wagholi';

      sheet.addRow([
        b1,
        1,
        1,
        '12/B',
        'Rajesh',
        'Kumar',
        'Sharma',
        'राजेश',
        'कुमार',
        'शर्मा',
        'ABC1234567',
        'Male',
        '15-08-1985',
        '9876543210',
        'rajesh@example.com',
        '123456789012',
        'ABCDE1234F',
        'Business',
        'Shopkeeper',
        c1,
        sc1,
        r1,
        p1,
        t1,
        v1,
        'Voter',
        'ACTIVE',
        'No',
        'No',
        'No',
        'B+',
      ]);

      // Data Validations
      // Col A: Select Booth (Dynamic)
      const boothFormula = registerDynamicLookup('Booths', boothNames);
      addListValidation('A', boothFormula);

      // Col L: Gender (Static)
      addListValidation('L', '"Male,Female,Other"');

      // Col M: DateOfBirth(dd-MM-yyyy)
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

      // Col R: ProfessionType (Static)
      addListValidation('R', '"Business,Service,Agriculture,Student,Housewife,Self-Employed,Unemployed,Professional,Other"');

      // Col T: Cast (Dynamic)
      const casteFormula = registerDynamicLookup('Castes', casteNames);
      addListValidation('T', casteFormula);

      // Col U: SubCast (Dynamic)
      const subcasteFormula = registerDynamicLookup('Subcastes', subcasteNames);
      addListValidation('U', subcasteFormula);

      // Col V: Religion (Dynamic)
      const religionFormula = registerDynamicLookup('Religions', religionNames);
      addListValidation('V', religionFormula);

      // Col W: Party (Dynamic)
      const partyFormula = registerDynamicLookup('Parties', partyNames);
      addListValidation('W', partyFormula);

      // Col X: Taluka (Dynamic)
      const talukaFormula = registerDynamicLookup('Talukas', talukaNames);
      addListValidation('X', talukaFormula);

      // Col Y: Village (Dynamic)
      const villageFormula = registerDynamicLookup('Villages', villageNames);
      addListValidation('Y', villageFormula);

      // Col Z: VoterType (Static)
      addListValidation('Z', '"Voter,Neutral Voter,Non Voter,Student,Senior,NRI,VIP"');

      // Col AA: Status (Static)
      addListValidation('AA', '"ACTIVE,INACTIVE,SHIFTED,UNVERIFIED,PENDING"');

      // Col AB: Is Dead (Static)
      addListValidation('AB', '"Yes,No"');

      // Col AC: Is Family Influencer (Static)
      addListValidation('AC', '"Yes,No"');

      // Col AD: Is Social Influencer (Static)
      addListValidation('AD', '"Yes,No"');

      // Col AE: Blood Group (Static)
      addListValidation('AE', '"A+,A-,B+,B-,AB+,AB-,O+,O-"');
    } else if (cat === 'castes') {
      sheet.addRow(['name', 'category', 'religionName']);
      const r1 = religionNames[0] || 'Hinduism';
      sheet.addRow(['Brahmin', 'General', r1]);

      // Col B: category (Static)
      addListValidation('B', '"General,OBC,SC,ST,Other"');

      // Col C: religionName (Dynamic)
      const religionFormula = registerDynamicLookup('Religions', religionNames);
      addListValidation('C', religionFormula);
    } else if (cat === 'religions') {
      sheet.addRow(['name']);
      sheet.addRow(['Hinduism']);
      sheet.addRow(['Islam']);
      sheet.addRow(['Christianity']);
    } else if (cat === 'states') {
      sheet.addRow(['name']);
      sheet.addRow(['Maharashtra']);
      sheet.addRow(['Uttar Pradesh']);
    } else if (cat === 'districts') {
      sheet.addRow(['name', 'stateName']);
      const s1 = stateNames[0] || 'Maharashtra';
      sheet.addRow(['Nagpur', s1]);

      // Col B: stateName (Dynamic)
      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('B', stateFormula);
    } else if (cat === 'pcs' || cat === 'parliamentary_constituencies') {
      sheet.addRow(['pcNumber', 'name', 'stateName']);
      const s1 = stateNames[0] || 'Maharashtra';
      sheet.addRow([1, 'Nagpur', s1]);

      // Col C: stateName (Dynamic)
      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('C', stateFormula);
    } else if (cat === 'acs' || cat === 'assembly_constituencies') {
      sheet.addRow(['acNumber', 'name', 'pcName', 'districtName']);
      const p1 = pcNames[0] || 'Nagpur';
      const d1 = districtNames[0] || 'Nagpur';
      sheet.addRow([52, 'Nagpur South West', p1, d1]);

      // Col C: pcName (Dynamic)
      const pcFormula = registerDynamicLookup('PCs', pcNames);
      addListValidation('C', pcFormula);

      // Col D: districtName (Dynamic)
      const distFormula = registerDynamicLookup('Districts', districtNames);
      addListValidation('D', distFormula);
    } else if (cat === 'wards') {
      sheet.addRow(['wardNumber', 'name', 'acName']);
      const a1 = acNames[0] || 'Nagpur South West';
      sheet.addRow([1, 'Ward No. 1', a1]);

      // Col C: acName (Dynamic)
      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);
    } else if (cat === 'booths' || cat === 'polling_booths') {
      sheet.addRow(['boothNumber', 'name', 'acName', 'wardName', 'locationBuilding', 'totalVoters']);
      const a1 = acNames[0] || 'Nagpur South West';
      sheet.addRow([1, 'Zilla Parishad Primary School Room 1', a1, 'Ward No. 1', 'Z.P. School', 850]);

      // Col C: acName (Dynamic)
      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);
    } else if (cat === 'parties' || cat === 'political_parties') {
      sheet.addRow(['name', 'abbreviation', 'symbolLogo']);
      sheet.addRow(['Bharatiya Janata Party', 'BJP', '/uploads/parties/bjp.png']);
      sheet.addRow(['Indian National Congress', 'INC', '/uploads/parties/inc.png']);

    } else {
      sheet.addRow(['name']);
      sheet.addRow(['Sample Entry 1']);
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


