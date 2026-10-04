import fs from 'fs';
import path from 'path';
import {
  initialReligions,
  initialCastes,
  initialParties,
  initialStates,
  initialDistricts,
} from '../data/masters.seed';
import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { CacheService } from '../../services/cache.service';
import { masterService } from '../../services/superAdmin/master.service';
import { initialPcs, initialAcs, initialWards, initialTalukas, initialVillages, initialBooths } from '../data/geography.seed';

export const seedMasters = async (): Promise<void> => {
  logger.info('Resetting & Cleaning All Database Tables & Redis Cache...');
  await CacheService.invalidatePattern('ranniti:*');

  // Reset all main database tables for a clean baseline rebuild
  try {
    await query(`
      DROP TABLE IF EXISTS voters CASCADE;
      DROP TABLE IF EXISTS tenant_assignments CASCADE;
      DROP TABLE IF EXISTS campaign_settings CASCADE;
      DROP TABLE IF EXISTS whatsapp_templates CASCADE;
      DROP TABLE IF EXISTS admin_users CASCADE;
      DROP TABLE IF EXISTS booths CASCADE;
      DROP TABLE IF EXISTS wards CASCADE;
      DROP TABLE IF EXISTS villages CASCADE;
      DROP TABLE IF EXISTS talukas CASCADE;
      DROP TABLE IF EXISTS assembly_constituencies CASCADE;
      DROP TABLE IF EXISTS parliamentary_constituencies CASCADE;
      DROP TABLE IF EXISTS districts CASCADE;
      DROP TABLE IF EXISTS states CASCADE;
      DROP TABLE IF EXISTS castes CASCADE;
      DROP TABLE IF EXISTS religions CASCADE;
      DROP TABLE IF EXISTS parties CASCADE;
    `);
    logger.info('Successfully cleaned and reset all database tables.');
  } catch (err: any) {
    logger.warn(`Notice during table reset: ${err.message}`);
  }

  logger.info('Executing Baseline Migration Schemas...');

  // Execute all required baseline migration schemas in order
  const migrationFiles = [
    'create_master_tables.sql',
    'create_roles_and_permissions_tables.sql',
    'create_admin_users_table.sql',
    'create_tenant_assignments_table.sql',
    'create_campaign_settings_tables.sql',
    'create_voters_table.sql',
  ];

  for (const file of migrationFiles) {
    const sqlPath = path.join(__dirname, '../../database/migrations', file);
    if (fs.existsSync(sqlPath)) {
      try {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        await query(sqlContent);
      } catch (err: any) {
        logger.warn(`Migration notice for ${file}: ${err.message}`);
      }
    }
  }

  // Seed Religions
  const existingReligions = await masterService.getReligions();
  const existingReligionNames = new Set(existingReligions.map((r) => r.name.toLowerCase()));

  for (const rel of initialReligions) {
    if (existingReligionNames.has(rel.name.toLowerCase())) {
      continue;
    }
    try {
      await masterService.createReligion(rel.name);
      existingReligionNames.add(rel.name.toLowerCase());
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
    const parentCasteName = (caste as any).parentCasteName;
    const parentCasteId = parentCasteName ? casteNameToIdMap.get(parentCasteName) : undefined;
    const religionId = caste.religionName ? relNameToIdMap.get(caste.religionName) : undefined;

    try {
      const created = await masterService.createCaste(caste.name, caste.category as any, religionId, parentCasteId);
      casteNameToIdMap.set(created.name, created.id);
      logger.info(`Seeded Caste: ${caste.name} (${caste.category})`);

      // Seed subcastes if provided
      if (Array.isArray((caste as any).subcastes)) {
        for (const subcasteName of (caste as any).subcastes) {
          if (!casteNameToIdMap.has(subcasteName)) {
            try {
              const createdSub = await masterService.createCaste(subcasteName, caste.category as any, religionId, created.id);
              casteNameToIdMap.set(createdSub.name, createdSub.id);
              logger.info(`Seeded Subcaste: ${subcasteName} (Parent: ${caste.name})`);
            } catch (err: any) {
              logger.warn(`Skipped Subcaste '${subcasteName}': ${err.message}`);
            }
          }
        }
      }
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
  await CacheService.invalidatePattern('*');
  const states = await masterService.getStates();
  const stateNameToIdMap = new Map<string, string>();
  for (const s of states) {
    stateNameToIdMap.set(s.name.toLowerCase().trim(), s.id);
  }

  // Seed Districts
  const existingDistricts = await masterService.getDistricts();
  const existingDistrictSet = new Set(
    existingDistricts.map((d) => `${d.stateId}_${d.name.toLowerCase()}`)
  );
  const districtNameToIdMap = new Map<string, string>();

  let newDistrictsCount = 0;
  for (const dist of initialDistricts) {
    const stateId = stateNameToIdMap.get((dist.stateName || '').toLowerCase().trim());
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

  // Seed Talukas
  const existingTalukas = await masterService.getTalukas();
  const existingTalukaSet = new Set(existingTalukas.map((t) => `${t.districtId}_${t.name.toLowerCase()}`));
  const talukaNameToIdMap = new Map<string, string>();
  for (const t of existingTalukas) {
    talukaNameToIdMap.set(t.name, t.id);
  }

  let newTalukasCount = 0;
  for (const taluka of initialTalukas) {
    const districtId = districtNameToIdMap.get(taluka.districtName);
    if (!districtId) {
      logger.warn(`District name '${taluka.districtName}' not found for Taluka '${taluka.name}'`);
      continue;
    }
    const key = `${districtId}_${taluka.name.toLowerCase()}`;
    if (!existingTalukaSet.has(key)) {
      try {
        const created = await masterService.createTaluka(districtId, taluka.name);
        talukaNameToIdMap.set(created.name, created.id);
        existingTalukaSet.add(key);
        newTalukasCount++;
      } catch (err: any) {
        logger.warn(`Skipped Taluka '${taluka.name}': ${err.message}`);
      }
    }
  }
  logger.info(`Seeded ${newTalukasCount} new Talukas.`);

  // Reload Talukas map
  const updatedTalukas = await masterService.getTalukas();
  for (const t of updatedTalukas) {
    talukaNameToIdMap.set(t.name, t.id);
  }

  // Seed Villages
  const existingVillages = await masterService.getVillages();
  const existingVillageSet = new Set((existingVillages as any[]).map((v: any) => `${v.talukaId}_${v.name.toLowerCase()}`));
  const villageNameToIdMap = new Map<string, string>();
  for (const v of existingVillages) {
    villageNameToIdMap.set(v.name, v.id);
  }

  let newVillagesCount = 0;
  for (const village of initialVillages) {
    const talukaId = talukaNameToIdMap.get(village.talukaName);
    if (!talukaId) {
      logger.warn(`Taluka name '${village.talukaName}' not found for Village '${village.name}'`);
      continue;
    }
    const key = `${talukaId}_${village.name.toLowerCase()}`;
    if (!existingVillageSet.has(key)) {
      try {
        const created = await masterService.createVillage(talukaId, village.name);
        villageNameToIdMap.set(created.name, created.id);
        existingVillageSet.add(key);
        newVillagesCount++;
      } catch (err: any) {
        logger.warn(`Skipped Village '${village.name}': ${err.message}`);
      }
    }
  }
  logger.info(`Seeded ${newVillagesCount} new Villages.`);

  // Reload Villages map
  const updatedVillages = await masterService.getVillages();
  for (const v of updatedVillages) {
    villageNameToIdMap.set(v.name, v.id);
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
    const stateId = stateNameToIdMap.get((pc.stateName || '').toLowerCase().trim());
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
  await CacheService.invalidatePattern('ranniti:*');
  const updatedPcs = await masterService.getPcs();
  for (const p of updatedPcs) {
    pcNameToIdMap.set(`${p.stateName}_${p.name}`.toLowerCase().trim(), p.id);
    pcNameToIdMap.set(p.name.toLowerCase().trim(), p.id);
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
    const pcId = pcNameToIdMap.get(`${(ac as any).stateName}_${ac.pcName}`.toLowerCase().trim())
      || pcNameToIdMap.get((ac.pcName || '').toLowerCase().trim());
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
    } else {
      // If the AC already exists by number, ensure its name is updated if changed (e.g. Pune Cantonment)
      await query(
        `UPDATE assembly_constituencies 
         SET name = $1, district_id = COALESCE($2, district_id), updated_at = NOW() 
         WHERE pc_id = $3 AND ac_number = $4 AND name != $1`,
        [ac.name, districtId || null, pcId, ac.acNumber]
      );
    }
  }
  logger.info(`Seeded ${newAcsCount} new Assembly Constituencies.`);

  // Reload ACs map
  const updatedAcs = await masterService.getAcs();
  for (const a of updatedAcs) {
    acNameToIdMap.set(a.name, a.id);
  }

  // Seed Wards
  const existingWards = await masterService.getWards();
  const existingWardSet = new Set((existingWards as any[]).map((w: any) => `${w.acId}_${w.wardNumber}`));
  const wardNameToIdMap = new Map<string, string>();
  for (const w of existingWards) {
    wardNameToIdMap.set(`${w.acId}_${w.wardNumber}`, w.id);
  }

  let newWardsCount = 0;
  for (const ward of initialWards) {
    const acId = acNameToIdMap.get(ward.acName);
    if (!acId) {
      logger.warn(`AC name '${ward.acName}' not found for Ward #${ward.wardNumber}`);
      continue;
    }
    const key = `${acId}_${ward.wardNumber}`;
    if (!existingWardSet.has(key)) {
      try {
        const created = await masterService.createWard({
          acId,
          wardNumber: ward.wardNumber,
          name: ward.name,
        });
        wardNameToIdMap.set(key, created.id);
        existingWardSet.add(key);
        newWardsCount++;
      } catch (err: any) {
        logger.warn(`Skipped Ward '${ward.name}': ${err.message}`);
      }
    }
  }
  logger.info(`Seeded ${newWardsCount} new Wards.`);

  // Reload Wards map
  const updatedWards = await masterService.getWards();
  for (const w of updatedWards) {
    wardNameToIdMap.set(`${w.acId}_${w.wardNumber}`, w.id);
  }

  // Seed Polling Booths
  const existingBooths = await masterService.getBooths();
  const existingBoothSet = new Set((existingBooths as any[]).map((b: any) => `${b.acId}_${b.boothNumber}`));

  let newBoothsCount = 0;
  for (const booth of initialBooths) {
    const acId = acNameToIdMap.get(booth.acName);
    if (!acId) {
      logger.warn(`AC name '${booth.acName}' not found for Booth #${booth.boothNumber}`);
      continue;
    }
    // Link to ward based on booth's wardNumber, or fallback to any ward of the AC
    let wardId = (booth.wardNumber ? wardNameToIdMap.get(`${acId}_${booth.wardNumber}`) : undefined)
      || wardNameToIdMap.get(`${acId}_1`)
      || wardNameToIdMap.get(`${acId}_2`);

    // Ensure there is ALWAYS a ward for every booth
    if (!wardId) {
      try {
        const autoWard = await masterService.createWard({
          acId,
          wardNumber: booth.wardNumber || 1,
          name: `Ward No. ${booth.wardNumber || 1} (${booth.acName})`,
        });
        wardId = autoWard.id;
        wardNameToIdMap.set(`${acId}_${autoWard.wardNumber}`, autoWard.id);
      } catch (err: any) {
        const existingWard = await query(`SELECT id FROM wards WHERE ac_id = $1 LIMIT 1`, [acId]);
        wardId = existingWard.rows[0]?.id;
      }
    }

    const key = `${acId}_${booth.boothNumber}`;
    if (!existingBoothSet.has(key)) {
      try {
        await masterService.createBooth({
          acId,
          wardId,
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
    } else {
      // If the booth already existed, make sure its ward_id is updated if missing or changed
      if (wardId) {
        await query(
          `UPDATE booths SET ward_id = $1, updated_at = NOW() WHERE ac_id = $2 AND booth_number = $3 AND (ward_id IS NULL OR ward_id != $1)`,
          [wardId, acId, booth.boothNumber]
        );
      }
    }
  }
  logger.info(`Seeded ${newBoothsCount} new Polling Booths.`);

  // Ensure EVERY Assembly Constituency in master DB has default Wards and Polling Booths
  const allAcsRes = await query(`SELECT id, name FROM assembly_constituencies`);
  let autoBoothsCreated = 0;
  for (const acRow of allAcsRes.rows) {
    const boothCountRes = await query(`SELECT COUNT(*)::int AS count FROM booths WHERE ac_id = $1`, [acRow.id]);
    if (boothCountRes.rows[0].count === 0) {
      // Ensure Ward 1 exists for this AC
      let wardRes = await query(`SELECT id FROM wards WHERE ac_id = $1 AND ward_number = 1 LIMIT 1`, [acRow.id]);
      let wardId = wardRes.rows[0]?.id;
      if (!wardId) {
        const newWard = await query(
          `INSERT INTO wards (ac_id, ward_number, name) VALUES ($1, 1, $2) RETURNING id`,
          [acRow.id, `Ward No. 1 (${acRow.name})`]
        );
        wardId = newWard.rows[0].id;
      }
      // Create 2 Polling Booths for this AC
      await query(
        `INSERT INTO booths (ac_id, ward_id, booth_number, name, location_building, total_voters)
         VALUES 
         ($1, $2, 101, $3, $4, 1200),
         ($1, $2, 102, $5, $6, 1150)
         ON CONFLICT (ac_id, booth_number) DO NOTHING`,
        [
          acRow.id,
          wardId,
          `Zilla Parishad Primary School Room 1 (${acRow.name})`,
          `Primary School Building, ${acRow.name}`,
          `Zilla Parishad Primary School Room 2 (${acRow.name})`,
          `Primary School Building, ${acRow.name}`,
        ]
      );
      autoBoothsCreated += 2;
    }
  }
  if (autoBoothsCreated > 0) {
    logger.info(`Auto-created ${autoBoothsCreated} Polling Booths for Assembly Constituencies missing booth data.`);
  }

  // Mandatory rule: "There will be always ward for booth"
  // For any booth anywhere in database that has NULL ward_id, ensure a ward exists and link it
  await query(`
    WITH missing_ac AS (
      SELECT DISTINCT b.ac_id, a.name AS ac_name
      FROM booths b
      JOIN assembly_constituencies a ON b.ac_id = a.id
      WHERE b.ward_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM wards w WHERE w.ac_id = b.ac_id)
    )
    INSERT INTO wards (ac_id, ward_number, name)
    SELECT ac_id, 1, 'Ward No. 1 (' || ac_name || ')'
    FROM missing_ac
    ON CONFLICT (ac_id, ward_number) DO NOTHING;
  `);

  await query(`
    UPDATE booths b
    SET ward_id = (
      SELECT w.id FROM wards w WHERE w.ac_id = b.ac_id ORDER BY w.ward_number ASC LIMIT 1
    )
    WHERE b.ward_id IS NULL;
  `);

  // Cascade to all voters so their ward_id matches their booth's ward_id
  await query(`
    UPDATE voters v
    SET ward_id = b.ward_id
    FROM booths b
    WHERE v.booth_id = b.id AND b.ward_id IS NOT NULL AND (v.ward_id IS NULL OR v.ward_id != b.ward_id);
  `);

  // Seed Campaign Settings if empty
  try {
    const csRes = await query(`SELECT id FROM campaign_settings LIMIT 1`);
    if (csRes.rows.length === 0) {
      await query(`
        INSERT INTO campaign_settings (
          candidate_name, party_name, party_symbol_url, candidate_photo_url,
          polling_date, election_type, whatsapp_quality_rating, whatsapp_daily_limit,
          whatsapp_waba_id, whatsapp_phone_number_id, fcm_project_id
        ) VALUES (
          'Rajesh Patil', 'Nationalist Congress Party', '/uploads/parties/ncp.png', '/uploads/avatars/leader.png',
          '2026-11-20', 'Assembly', 'GREEN', '10K',
          'WABA_1092837465', 'PHONE_919820011223', 'ranniti-campaign-2026'
        )
      `);
      logger.info('Seeded default Campaign Settings.');
    }
  } catch (err: any) {
    logger.warn(`Skipped Campaign Settings seeding: ${err.message}`);
  }

  // Seed WhatsApp Templates
  const initialTemplates = [
    {
      metaTemplateId: 'TMPL_VOTER_SLIP_01',
      name: 'voter_slip_delivery',
      category: 'UTILITY',
      language: 'hi',
      headerType: 'TEXT',
      headerContent: 'मतदाता पर्ची - चुनाव 2026',
      bodyText: 'नमस्ते {{1}}, आपका मतदान केंद्र {{2}} है। भाग संख्या {{3}}, क्रमांक संख्या {{4}}। कृपया 20 नवंबर को मतदान अवश्य करें।',
      footerText: 'रणनीति इलेक्शन सेल',
      metaStatus: 'APPROVED',
    },
    {
      metaTemplateId: 'TMPL_RALLY_INVITE_02',
      name: 'campaign_rally_invite',
      category: 'MARKETING',
      language: 'hi',
      headerType: 'IMAGE',
      headerContent: '/uploads/campaign/rally.png',
      bodyText: 'प्रिय कार्यकर्ता {{1}}, कल शाम 5 बजे {{2}} में विशाल जनसभा आयोजित है। उम्मीदवार {{3}} जी मार्गदर्शन करेंगे। अपनी उपस्थिति सुनिश्चित करें।',
      footerText: 'प्रचार समिति',
      metaStatus: 'APPROVED',
    },
    {
      metaTemplateId: 'TMPL_BOOTH_TASK_03',
      name: 'booth_worker_briefing',
      category: 'UTILITY',
      language: 'en',
      headerType: 'NONE',
      headerContent: null,
      bodyText: 'Hello {{1}}, you are assigned as Booth Incharge for Booth #{{2}} - {{3}}. Target voters: {{4}}. Please complete morning setup by 6:00 AM.',
      footerText: 'Ranniti Campaign HQ',
      metaStatus: 'APPROVED',
    },
    {
      metaTemplateId: 'TMPL_POLL_DAY_04',
      name: 'poll_day_reminder',
      category: 'UTILITY',
      language: 'hi',
      headerType: 'TEXT',
      headerContent: 'मतदान दिवस स्मरण पत्र',
      bodyText: 'सम्मानित मतदाता {{1}}, आज मतदान का दिन है! लोकतंत्र के महापर्व में भाग लें और अपना बहुमूल्य वोट डालें। मतदान समय: प्रातः 7:00 से सायं 6:00 तक।',
      footerText: 'रणनीति टीम',
      metaStatus: 'APPROVED',
    },
  ];

  try {
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_templates_name_lang ON whatsapp_templates(name, language);`);
  } catch (err: any) {
    logger.warn(`WhatsApp templates unique index check notice: ${err.message}`);
  }

  for (const t of initialTemplates) {
    try {
      await query(
        `INSERT INTO whatsapp_templates (
          meta_template_id, name, category, language, header_type, header_content, body_text, footer_text, meta_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (name, language) DO UPDATE SET
          meta_template_id = EXCLUDED.meta_template_id,
          header_type = EXCLUDED.header_type,
          header_content = EXCLUDED.header_content,
          body_text = EXCLUDED.body_text,
          footer_text = EXCLUDED.footer_text,
          meta_status = EXCLUDED.meta_status,
          updated_at = NOW()`,
        [t.metaTemplateId, t.name, t.category, t.language, t.headerType, t.headerContent, t.bodyText, t.footerText, t.metaStatus]
      );
      logger.info(`Seeded WhatsApp Template: ${t.name} (${t.language})`);
    } catch (err: any) {
      logger.warn(`Skipped WhatsApp Template '${t.name}': ${err.message}`);
    }
  }

  logger.info('Finished Master Datasets seeding.');
};

