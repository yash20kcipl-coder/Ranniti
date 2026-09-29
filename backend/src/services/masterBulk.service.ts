import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { logger } from '../utils/logger';
import { BulkImporter } from '../utils/bulkImporter';
import { importJobTracker } from './importJobTracker';
import { MasterQueries } from '../queries/master.queries';
import { calculateAge, formatDateForDb } from '../utils/dateUtils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MasterBulkService {
  // Helper to resolve or auto-create Religion ID
  private static async resolveReligionId(val?: string): Promise<string | undefined> {
    if (!val || !val.trim()) return undefined;
    const cleanVal = val.trim();
    if (UUID_REGEX.test(cleanVal)) return cleanVal;

    const religions = await MasterQueries.getReligions();
    const existing = religions.find((r) => r.name.toLowerCase() === cleanVal.toLowerCase());
    if (existing) return existing.id;

    // Auto-create new Religion if it does not exist yet
    const created = await MasterQueries.createReligion(cleanVal);
    logger.info(`[MasterBulkService] Auto-created new Religion: '${cleanVal}' (${created.id})`);
    return created.id;
  }

  // Helper to resolve or auto-create State ID
  private static async resolveStateId(val?: string): Promise<string | undefined> {
    if (!val || !val.trim()) return undefined;
    const cleanVal = val.trim();
    if (UUID_REGEX.test(cleanVal)) return cleanVal;

    const states = await MasterQueries.getStates();
    const existing = states.find((s) => s.name.toLowerCase() === cleanVal.toLowerCase());
    if (existing) return existing.id;

    // Auto-create new State if it does not exist yet
    const created = await MasterQueries.createState(cleanVal);
    logger.info(`[MasterBulkService] Auto-created new State: '${cleanVal}' (${created.id})`);
    return created.id;
  }

  // Helper to resolve or auto-create District ID
  private static async resolveDistrictId(stateId?: string, val?: string): Promise<string | undefined> {
    if (!val || !val.trim()) return undefined;
    const cleanVal = val.trim();
    if (UUID_REGEX.test(cleanVal)) return cleanVal;

    const districts = await MasterQueries.getDistricts(stateId);
    const existing = districts.find((d) => d.name.toLowerCase() === cleanVal.toLowerCase());
    if (existing) return existing.id;

    if (stateId) {
      const created = await MasterQueries.createDistrict(stateId, cleanVal);
      logger.info(`[MasterBulkService] Auto-created new District: '${cleanVal}' under state ${stateId}`);
      return created.id;
    }
    return undefined;
  }

  // Helper to resolve or auto-create PC ID
  private static async resolvePcId(stateId?: string, val?: string, pcNumberHint = 1): Promise<string | undefined> {
    if (!val || !val.trim()) return undefined;
    const cleanVal = val.trim();
    if (UUID_REGEX.test(cleanVal)) return cleanVal;

    const pcs = await MasterQueries.getPcs(stateId);
    const existing = pcs.find((p) => p.name.toLowerCase() === cleanVal.toLowerCase());
    if (existing) return existing.id;

    if (stateId) {
      const created = await MasterQueries.createPc(stateId, pcNumberHint, cleanVal);
      logger.info(`[MasterBulkService] Auto-created new PC: '${cleanVal}' under state ${stateId}`);
      return created.id;
    }
    return undefined;
  }

  // Helper to resolve or auto-create AC ID
  private static async resolveAcId(pcId?: string, val?: string, districtId?: string, acNumberHint = 1): Promise<string | undefined> {
    if (!val || !val.trim()) return undefined;
    const cleanVal = val.trim();
    if (UUID_REGEX.test(cleanVal)) return cleanVal;

    const acs = await MasterQueries.getAcs(pcId, districtId);
    const existing = acs.find((a) => a.name.toLowerCase() === cleanVal.toLowerCase());
    if (existing) return existing.id;

    if (pcId) {
      const created = await MasterQueries.createAc(pcId, acNumberHint, cleanVal, districtId);
      logger.info(`[MasterBulkService] Auto-created new AC: '${cleanVal}' under PC ${pcId}`);
      return created.id;
    }
    return undefined;
  }

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
        case 'religions':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.religionName || '').trim();
                if (name) {
                  await MasterQueries.createReligion(name);
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'castes':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.casteName || '').trim();
                const categoryName = (row.category || 'General').trim();
                const religionRef = row.religionName || row.religion || row.religionId || row.religion_id;
                const religionId = await this.resolveReligionId(religionRef);

                if (name && categoryName) {
                  await MasterQueries.createCaste(
                    name,
                    categoryName,
                    religionId,
                    row.parentCasteId || row.parent_caste_id || undefined
                  );
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'states':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.stateName || '').trim();
                if (name) {
                  await MasterQueries.createState(name);
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'districts':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.districtName || '').trim();
                const stateRef = row.stateName || row.state || row.stateId || row.state_id;
                const stateId = await this.resolveStateId(stateRef);

                if (name && stateId) {
                  await MasterQueries.createDistrict(stateId, name);
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'pcs':
        case 'parliamentary_constituencies':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.pcName || '').trim();
                const pcNum = Number(row.pcNumber || row.pc_number || 1);
                const stateRef = row.stateName || row.state || row.stateId || row.state_id;
                const stateId = await this.resolveStateId(stateRef);

                if (name && stateId) {
                  await MasterQueries.createPc(stateId, pcNum, name);
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'acs':
        case 'assembly_constituencies':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.acName || '').trim();
                const acNum = Number(row.acNumber || row.ac_number || 1);
                const stateRef = row.stateName || row.state || row.stateId || row.state_id;
                const stateId = await this.resolveStateId(stateRef);

                const pcRef = row.pcName || row.pc || row.pcId || row.pc_id;
                const pcId = await this.resolvePcId(stateId, pcRef, acNum);

                const districtRef = row.districtName || row.district || row.districtId || row.district_id;
                const districtId = await this.resolveDistrictId(stateId, districtRef);

                if (name && pcId) {
                  await MasterQueries.createAc(pcId, acNum, name, districtId);
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'booths':
        case 'polling_booths':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.boothName || '').trim();
                const boothNum = Number(row.boothNumber || row.booth_number || 1);
                const acRef = row.acName || row.ac || row.acId || row.ac_id;
                const acId = await this.resolveAcId(undefined, acRef, undefined, boothNum);

                if (name && acId) {
                  await MasterQueries.createBooth({
                    acId,
                    boothNumber: boothNum,
                    name,
                    locationBuilding: row.locationBuilding || row.location_building || undefined,
                    totalVoters: Number(row.totalVoters || row.total_voters || 0),
                  });
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'parties':
        case 'political_parties':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.partyName || '').trim();
                const abbrev = (row.abbreviation || row.code || '').trim();
                if (name && abbrev) {
                  await MasterQueries.createParty(
                    name,
                    abbrev,
                    row.symbolLogo || row.symbol_logo || undefined
                  );
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'organizations':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              for (const row of batch) {
                const name = (row.name || row.orgName || '').trim();
                const code = (row.code || '').trim();
                const acRef = row.acName || row.ac || row.acId || row.ac_id;
                const acId = await this.resolveAcId(undefined, acRef);

                if (name && code) {
                  await MasterQueries.createOrganization({
                    name,
                    code,
                    acId,
                    status: row.status || 'active',
                  });
                  inserted++;
                }
              }
              return inserted;
            },
          });
          break;

        case 'voters':
          result = await BulkImporter.processArray(records, {
            batchSize: 500,
            concurrency: 2,
            onProgress: progressCallback,
            onBatchInsert: async (batch) => {
              let inserted = 0;
              const { VoterQueries } = await import('../queries/voter.queries');
              const { MasterQueries } = await import('../queries/master.queries');
              const booths = await MasterQueries.getBooths();
              const religions = await MasterQueries.getReligions();
              const castes = await MasterQueries.getCastes();
              const parties = await MasterQueries.getParties().catch(() => []);
              const states = await MasterQueries.getStates().catch(() => []);
              const districts = await MasterQueries.getDistricts().catch(() => []);
              const pcs = await MasterQueries.getPcs().catch(() => []);
              const acs = await MasterQueries.getAcs().catch(() => []);

              const parseBool = (val: any): boolean => {
                if (val === true || val === 1) return true;
                if (typeof val === 'string') {
                  const lower = val.trim().toLowerCase();
                  return lower === 'yes' || lower === 'true' || lower === '1' || lower === 'y';
                }
                return false;
              };

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

                // Resolve Booth & Hierarchy
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
                  resolvedBooth = booths.find(
                    (b) =>
                      b.id === boothRef ||
                      b.name.toLowerCase() === boothRef.toLowerCase() ||
                      String(b.boothNumber) === boothRef
                  );
                }
                if (!resolvedBooth && boothNumRef !== undefined && boothNumRef !== '') {
                  resolvedBooth = booths.find((b) => String(b.boothNumber) === String(boothNumRef));
                }
                if (resolvedBooth) {
                  boothId = resolvedBooth.id;
                }

                // Resolve AC, PC, District, State
                let acId: string | undefined = resolvedBooth?.acId;
                const acRef = (row['AC Name'] || row['acName'] || row['acId'] || '').toString().trim();
                if (!acId && acRef) {
                  const foundAc = acs.find((a) => a.id === acRef || a.name.toLowerCase() === acRef.toLowerCase());
                  if (foundAc) acId = foundAc.id;
                }

                let pcId: string | undefined = undefined;
                const pcRef = (row['PC Name'] || row['pcName'] || row['pcId'] || '').toString().trim();
                if (acId) {
                  const parentAc = acs.find((a) => a.id === acId);
                  if (parentAc?.pcId) pcId = parentAc.pcId;
                }
                if (!pcId && pcRef) {
                  const foundPc = pcs.find((p) => p.id === pcRef || p.name.toLowerCase() === pcRef.toLowerCase());
                  if (foundPc) pcId = foundPc.id;
                }

                let districtId: string | undefined = undefined;
                const distRef = (row['District Name'] || row['districtName'] || row['districtId'] || '').toString().trim();
                if (acId) {
                  const parentAc = acs.find((a) => a.id === acId);
                  if (parentAc?.districtId) districtId = parentAc.districtId;
                }
                if (!districtId && distRef) {
                  const foundDist = districts.find((d) => d.id === distRef || d.name.toLowerCase() === distRef.toLowerCase());
                  if (foundDist) districtId = foundDist.id;
                }

                let stateId: string | undefined = undefined;
                const stateRef = (row['State Name'] || row['stateName'] || row['stateId'] || '').toString().trim();
                if (districtId) {
                  const parentDist = districts.find((d) => d.id === districtId);
                  if (parentDist?.stateId) stateId = parentDist.stateId;
                }
                if (!stateId && stateRef) {
                  const foundState = states.find((s) => s.id === stateRef || s.name.toLowerCase() === stateRef.toLowerCase());
                  if (foundState) stateId = foundState.id;
                }

                // Resolve Party
                const partyRef = (row['Party'] || row['partyName'] || row['partyId'] || row['Party Name'] || '').toString().trim();
                let partyId: string | undefined = undefined;
                if (partyRef) {
                  const foundParty = parties.find(
                    (p) =>
                      p.id === partyRef ||
                      p.name.toLowerCase() === partyRef.toLowerCase() ||
                      (p.abbreviation && p.abbreviation.toLowerCase() === partyRef.toLowerCase())
                  );
                  if (foundParty) partyId = foundParty.id;
                }

                // Resolve Religion
                const relRef = (row['Religion'] || row['religionName'] || row['religionId'] || '').toString().trim();
                let religionId: string | undefined = undefined;
                if (relRef) {
                  const foundRel = religions.find((r) => r.id === relRef || r.name.toLowerCase() === relRef.toLowerCase());
                  if (foundRel) religionId = foundRel.id;
                }

                // Resolve Caste
                const casteRef = (row['Caste'] || row['Cast'] || row['casteName'] || row['casteId'] || '').toString().trim();
                let casteId: string | undefined = undefined;
                if (casteRef) {
                  const foundCaste = castes.find((c) => c.id === casteRef || c.name.toLowerCase() === casteRef.toLowerCase());
                  if (foundCaste) casteId = foundCaste.id;
                }

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

                try {
                  await VoterQueries.createVoter({
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
                  inserted++;
                } catch (rowErr: any) {
                  logger.warn(`[MasterBulkService] Skipped row for EPIC '${epicNo}': ${rowErr.message}`);
                }
              }
              return inserted;
            },
          });
          break;

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

    if (cat === 'organizations') {
      const acs = await MasterQueries.getAcs();
      const ac1 = acs[0]?.name || 'Nagpur South West';
      return `name,code,acName,status\nYouth Congress Nagpur,YCN,${ac1},active\nBJP Yuva Morcha,BJPYM,${ac1},active`;
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
    const [religions, castes, states, districts, pcs, acs, booths] = await Promise.all([
      MasterQueries.getReligions().catch(() => []),
      MasterQueries.getCastes().catch(() => []),
      MasterQueries.getStates().catch(() => []),
      MasterQueries.getDistricts().catch(() => []),
      MasterQueries.getPcs().catch(() => []),
      MasterQueries.getAcs().catch(() => []),
      MasterQueries.getBooths().catch(() => []),
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
        'VoterType',
      ];
      sheet.addRow(headers);

      // Sample Row 2
      const b1 = boothNames[0] || 'Zilla Parishad Primary School Room 1';
      const r1 = religionNames[0] || 'Hinduism';
      const c1 = casteNames[0] || 'Brahmin';
      const sc1 = subcasteNames[0] || 'Kanyakubj';
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
        'Voter',
      ]);

      // Data Validations
      // Col A: Select Booth (Dynamic)
      const boothFormula = registerDynamicLookup('Booths', boothNames);
      addListValidation('A', boothFormula);

      // Col L: Gender (Static)
      addListValidation('L', '"Male,Female,Other"');

      // Col M: DateOfBirth(dd-MM-yyyy) (Interactive Date Picker Validation & dd-mm-yyyy formatting)
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

      // Col W: VoterType (Static)
      addListValidation('W', '"Voter,Neutral Voter,Non Voter,Student,Senior,NRI,VIP"');
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
    } else if (cat === 'booths' || cat === 'polling_booths') {
      sheet.addRow(['boothNumber', 'name', 'acName', 'locationBuilding', 'totalVoters']);
      const a1 = acNames[0] || 'Nagpur South West';
      sheet.addRow([1, 'Zilla Parishad Primary School Room 1', a1, 'Z.P. School', 850]);

      // Col C: acName (Dynamic)
      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);
    } else if (cat === 'parties' || cat === 'political_parties') {
      sheet.addRow(['name', 'abbreviation', 'symbolLogo']);
      sheet.addRow(['Bharatiya Janata Party', 'BJP', '/uploads/parties/bjp.png']);
      sheet.addRow(['Indian National Congress', 'INC', '/uploads/parties/inc.png']);
    } else if (cat === 'organizations') {
      sheet.addRow(['name', 'code', 'acName', 'status']);
      const a1 = acNames[0] || 'Nagpur South West';
      sheet.addRow(['Youth Congress Nagpur', 'YCN', a1, 'active']);

      // Col C: acName (Dynamic)
      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);

      // Col D: status (Static)
      addListValidation('D', '"active,inactive,suspended"');
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


