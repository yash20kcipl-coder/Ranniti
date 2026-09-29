import fs from 'fs';
import path from 'path';
import {
  initialReligions,
  initialCastes,
  initialParties,
  initialStates,
  initialDistricts,
  initialOrganizations,
} from '../data/masters.seed';
import { logger } from '../../utils/logger';
import { masterService } from '../../services/master.service';
import { query } from '../../queries/dbPool';
import { initialPcs, initialAcs, initialBooths } from '../data/geography.seed';

export const seedMasters = async (): Promise<void> => {
  logger.info('Seeding Master Datasets...');

  // Ensure Voters Table DDL & Extended Columns DDL are executed
  try {
    const voterSqlPath = path.join(__dirname, '../../database/migrations/create_voters_table.sql');
    if (fs.existsSync(voterSqlPath)) {
      const sqlContent = fs.readFileSync(voterSqlPath, 'utf8');
      await query(sqlContent);
      logger.info('Successfully executed voters table migration schema.');
    }
    const extSqlPath = path.join(__dirname, '../../database/migrations/add_voter_extended_fields.sql');
    if (fs.existsSync(extSqlPath)) {
      const sqlContent = fs.readFileSync(extSqlPath, 'utf8');
      await query(sqlContent);
      logger.info('Successfully executed voter extended fields migration schema.');
    }
    const infSqlPath = path.join(__dirname, '../../database/migrations/add_influencer_flags_to_voters.sql');
    if (fs.existsSync(infSqlPath)) {
      const sqlContent = fs.readFileSync(infSqlPath, 'utf8');
      await query(sqlContent);
      logger.info('Successfully executed voter influencer flags migration schema.');
    }
  } catch (err: any) {
    logger.warn(`Voters migration execution notice: ${err.message}`);
  }

  // Seed Religions
  for (const rel of initialReligions) {
    try {
      await masterService.createReligion(rel.name);
      logger.info(`Seeded Religion: ${rel.name}`);
    } catch (err: any) {
      logger.warn(`Skipped Religion '${rel.name}': ${err.message}`);
    }
  }

  // Seed Castes & Subcastes
  const religions = await masterService.getReligions();
  const relNameToIdMap = new Map<string, string>();
  for (const r of religions) {
    relNameToIdMap.set(r.name, r.id);
  }

  const existingCastesList = await masterService.getCastes();
  const casteNameToIdMap = new Map<string, string>();
  for (const c of existingCastesList) {
    casteNameToIdMap.set(c.name, c.id);
  }

  for (const caste of initialCastes) {
    if (casteNameToIdMap.has(caste.name)) {
      continue;
    }
    const religionId = caste.religionName ? relNameToIdMap.get(caste.religionName) : undefined;
    const parentCasteId = caste.parentCasteName ? casteNameToIdMap.get(caste.parentCasteName) : undefined;

    try {
      const created = await masterService.createCaste(caste.name, caste.category as any, religionId, parentCasteId);
      casteNameToIdMap.set(created.name, created.id);
      logger.info(`Seeded Caste: ${caste.name} (${caste.category})`);
    } catch (err: any) {
      logger.warn(`Skipped Caste '${caste.name}': ${err.message}`);
    }
  }

  // Seed Parties
  for (const party of initialParties) {
    try {
      await query(
        `INSERT INTO parties (name, abbreviation, symbol_logo) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET abbreviation = EXCLUDED.abbreviation, symbol_logo = EXCLUDED.symbol_logo, updated_at = NOW()`,
        [party.name, party.abbreviation, party.symbolLogo]
      );
      logger.info(`Seeded Party: ${party.abbreviation}`);
    } catch (err: any) {
      logger.warn(`Skipped Party '${party.abbreviation}': ${err.message}`);
    }
  }

  // Seed States
  const existingStates = await masterService.getStates();
  const existingStateNames = new Set(existingStates.map((s) => s.name.toLowerCase()));

  for (const state of initialStates) {
    if (existingStateNames.has(state.name.toLowerCase())) {
      continue;
    }
    try {
      await masterService.createState(state.name);
      existingStateNames.add(state.name.toLowerCase());
      logger.info(`Seeded State: ${state.name}`);
    } catch (err: any) {
      logger.warn(`Skipped State '${state.name}': ${err.message}`);
    }
  }

  // Reload states map for reference
  const states = await masterService.getStates();
  const stateNameToIdMap = new Map<string, string>();
  for (const s of states) {
    stateNameToIdMap.set(s.name, s.id);
  }

  // Seed Districts
  const existingDistricts = await masterService.getDistricts();
  const existingDistrictSet = new Set(
    existingDistricts.map((d) => `${d.stateId}_${d.name.toLowerCase()}`)
  );
  const districtNameToIdMap = new Map<string, string>();

  let newDistrictsCount = 0;
  for (const dist of initialDistricts) {
    const stateId = stateNameToIdMap.get(dist.stateName);
    if (!stateId) {
      logger.warn(`State name '${dist.stateName}' not found for District '${dist.name}'`);
      continue;
    }

    const key = `${stateId}_${dist.name.toLowerCase()}`;
    if (!existingDistrictSet.has(key)) {
      try {
        await masterService.createDistrict(stateId, dist.name);
        existingDistrictSet.add(key);
        newDistrictsCount++;
      } catch (err: any) {
        logger.warn(`Skipped District '${dist.name}': ${err.message}`);
      }
    }
  }
  logger.info(`Seeded ${newDistrictsCount} new Districts.`);

  // Reload districts map
  const updatedDistricts = await masterService.getDistricts();
  for (const d of updatedDistricts) {
    districtNameToIdMap.set(d.name, d.id);
  }

  // Seed Parliamentary Constituencies (PC)
  const existingPcs = await masterService.getPcs();
  const existingPcSet = new Set(existingPcs.map((p) => `${p.stateId}_${p.pcNumber}`));
  const pcNameToIdMap = new Map<string, string>();
  for (const p of existingPcs) {
    pcNameToIdMap.set(p.name, p.id);
  }

  let newPcsCount = 0;
  for (const pc of initialPcs) {
    const stateId = stateNameToIdMap.get(pc.stateName);
    if (!stateId) {
      logger.warn(`State name '${pc.stateName}' not found for PC '${pc.name}'`);
      continue;
    }
    const key = `${stateId}_${pc.pcNumber}`;
    if (!existingPcSet.has(key)) {
      try {
        const created = await masterService.createPc(stateId, pc.pcNumber, pc.name);
        pcNameToIdMap.set(created.name, created.id);
        existingPcSet.add(key);
        newPcsCount++;
      } catch (err: any) {
        logger.warn(`Skipped PC '${pc.name}': ${err.message}`);
      }
    }
  }
  logger.info(`Seeded ${newPcsCount} new Parliamentary Constituencies.`);

  // Reload PCs map
  const updatedPcs = await masterService.getPcs();
  for (const p of updatedPcs) {
    pcNameToIdMap.set(p.name, p.id);
  }

  // Seed Assembly Constituencies (AC)
  const existingAcs = await masterService.getAcs();
  const existingAcSet = new Set(existingAcs.map((a) => `${a.pcId}_${a.acNumber}`));
  const acNameToIdMap = new Map<string, string>();
  for (const a of existingAcs) {
    acNameToIdMap.set(a.name, a.id);
  }

  let newAcsCount = 0;
  for (const ac of initialAcs) {
    const pcId = pcNameToIdMap.get(ac.pcName);
    if (!pcId) {
      logger.warn(`PC name '${ac.pcName}' not found for AC '${ac.name}'`);
      continue;
    }
    const districtId = districtNameToIdMap.get(ac.districtName);
    const key = `${pcId}_${ac.acNumber}`;
    if (!existingAcSet.has(key)) {
      try {
        const created = await masterService.createAc(pcId, ac.acNumber, ac.name, districtId);
        acNameToIdMap.set(created.name, created.id);
        existingAcSet.add(key);
        newAcsCount++;
      } catch (err: any) {
        logger.warn(`Skipped AC '${ac.name}': ${err.message}`);
      }
    }
  }
  logger.info(`Seeded ${newAcsCount} new Assembly Constituencies.`);

  // Reload ACs map
  const updatedAcs = await masterService.getAcs();
  for (const a of updatedAcs) {
    acNameToIdMap.set(a.name, a.id);
  }

  // Seed Polling Booths
  const existingBooths = await masterService.getBooths();
  const existingBoothSet = new Set(existingBooths.map((b) => `${b.acId}_${b.boothNumber}`));

  let newBoothsCount = 0;
  for (const booth of initialBooths) {
    const acId = acNameToIdMap.get(booth.acName);
    if (!acId) {
      logger.warn(`AC name '${booth.acName}' not found for Booth #${booth.boothNumber}`);
      continue;
    }
    const key = `${acId}_${booth.boothNumber}`;
    if (!existingBoothSet.has(key)) {
      try {
        await masterService.createBooth({
          acId,
          boothNumber: booth.boothNumber,
          name: booth.name,
          locationBuilding: booth.locationBuilding,
          totalVoters: booth.totalVoters,
        });
        existingBoothSet.add(key);
        newBoothsCount++;
      } catch (err: any) {
        logger.warn(`Skipped Booth '${booth.name}': ${err.message}`);
      }
    }
  }
  logger.info(`Seeded ${newBoothsCount} new Polling Booths.`);

  // Seed Organizations
  for (const org of initialOrganizations) {
    try {
      await masterService.createOrganization(org as any);
      logger.info(`Seeded Organization: ${org.name}`);
    } catch (err: any) {
      logger.warn(`Skipped Organization '${org.name}': ${err.message}`);
    }
  }

  logger.info('Finished Master Datasets seeding.');
};

