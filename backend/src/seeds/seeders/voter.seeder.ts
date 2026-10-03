import { query } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

// Realistic Indian Names & Demographics datasets
const firstNamesMale = [
  { eng: 'Rajesh', loc: 'राजेश' },
  { eng: 'Amit', loc: 'अमित' },
  { eng: 'Rahul', loc: 'राहुल' },
  { eng: 'Suresh', loc: 'सुरेश' },
  { eng: 'Vikas', loc: 'विकास' },
  { eng: 'Sunil', loc: 'सुनील' },
  { eng: 'Anil', loc: 'अनिल' },
  { eng: 'Vijay', loc: 'विजय' },
  { eng: 'Sanjay', loc: 'संजय' },
  { eng: 'Manoj', loc: 'मनोज' },
  { eng: 'Deepak', loc: 'दीपक' },
  { eng: 'Ajay', loc: 'अजय' },
  { eng: 'Prakash', loc: 'प्रकाश' },
  { eng: 'Ramesh', loc: 'रमेश' },
  { eng: 'Dinesh', loc: 'दिनेश' },
  { eng: 'Sachin', loc: 'सचिन' },
  { eng: 'Nitin', loc: 'नितिन' },
  { eng: 'Ganesh', loc: 'गणेश' },
  { eng: 'Prashant', loc: 'प्रशांत' },
  { eng: 'Mahesh', loc: 'महेश' },
];

const firstNamesFemale = [
  { eng: 'Sunita', loc: 'सुनिता' },
  { eng: 'Priya', loc: 'प्रिया' },
  { eng: 'Anjali', loc: 'अंजली' },
  { eng: 'Pooja', loc: 'पूजा' },
  { eng: 'Kavita', loc: 'कविता' },
  { eng: 'Anita', loc: 'अनीता' },
  { eng: 'Sangeeta', loc: 'संगीत' },
  { eng: 'Rekha', loc: 'रेखा' },
  { eng: 'Meena', loc: 'मीना' },
  { eng: 'Savita', loc: 'सविता' },
  { eng: 'Lata', loc: 'लता' },
  { eng: 'Aarti', loc: 'आरती' },
  { eng: 'Shilpa', loc: 'शिल्पा' },
  { eng: 'Neha', loc: 'नेहा' },
  { eng: 'Swati', loc: 'स्वाती' },
  { eng: 'Varsha', loc: 'वर्षा' },
  { eng: 'Sushma', loc: 'सुषमा' },
  { eng: 'Seema', loc: 'सीमा' },
  { eng: 'Rashmi', loc: 'रश्मी' },
  { eng: 'Archana', loc: 'अर्चना' },
];

const middleNamesMale = [
  { eng: 'Kumar', loc: 'कुमार' },
  { eng: 'Ramesh', loc: 'रमेश' },
  { eng: 'Prakash', loc: 'प्रकाश' },
  { eng: 'Vijay', loc: 'विजय' },
  { eng: 'Dattatray', loc: 'दत्तात्रेय' },
  { eng: 'Chandrakant', loc: 'चंद्रकांत' },
  { eng: 'Shantaram', loc: 'शांताराम' },
  { eng: 'Baban', loc: 'बबन' },
];

const middleNamesFemale = [
  { eng: 'Devi', loc: 'देवी' },
  { eng: 'Rani', loc: 'राणी' },
  { eng: 'Kumari', loc: 'कुमारी' },
  { eng: 'Rajesh', loc: 'राजेश' },
  { eng: 'Suresh', loc: 'सुरेश' },
  { eng: 'Ramesh', loc: 'रमेश' },
];

const surnames = [
  { eng: 'Sharma', loc: 'शर्मा' },
  { eng: 'Patel', loc: 'पटेल' },
  { eng: 'Verma', loc: 'वर्मा' },
  { eng: 'Yadav', loc: 'यादव' },
  { eng: 'Joshi', loc: 'जोषी' },
  { eng: 'Kulkarni', loc: 'कुलकर्णी' },
  { eng: 'Gupta', loc: 'गुप्ता' },
  { eng: 'Deshmukh', loc: 'देशमुख' },
  { eng: 'Patil', loc: 'पाटील' },
  { eng: 'Pawar', loc: 'पवार' },
  { eng: 'Shinde', loc: 'शिंदे' },
  { eng: 'Jadhav', loc: 'जाधव' },
  { eng: 'Kadam', loc: 'कदम' },
  { eng: 'Gaikwad', loc: 'गायकवाड' },
  { eng: 'Chavan', loc: 'चव्हाण' },
  { eng: 'More', loc: 'मोरे' },
];

const voterTypes = ['Voter', 'Voter', 'Voter', 'Student', 'Senior', 'NRI', 'VIP', 'Neutral Voter', 'Non Voter'];
const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'SHIFTED', 'UNVERIFIED', 'INACTIVE'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+'];

export const seedVoters = async (count: number = 1000): Promise<void> => {
  logger.info(`Starting Seeding of ${count} Voter Records...`);

  // Ensure all recent voter schema columns exist
  await query(`
    ALTER TABLE voters 
      ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS family_id VARCHAR(50);
  `);

  // Fetch Existing Master Data IDs with complete geographic hierarchy
  const boothsRes = await query(`
    SELECT 
      b.id, 
      b.ac_id,
      b.ward_id,
      b.booth_number,
      a.pc_id,
      a.district_id,
      COALESCE(d.state_id, p.state_id) AS state_id
    FROM booths b
    LEFT JOIN assembly_constituencies a ON b.ac_id = a.id
    LEFT JOIN parliamentary_constituencies p ON a.pc_id = p.id
    LEFT JOIN districts d ON a.district_id = d.id
    ORDER BY b.booth_number ASC
  `);
  const acsRes = await query('SELECT id, pc_id, district_id FROM assembly_constituencies ORDER BY id ASC LIMIT 50');
  const pcsRes = await query('SELECT id, state_id FROM parliamentary_constituencies ORDER BY id ASC LIMIT 50');
  const districtsRes = await query('SELECT id, state_id FROM districts ORDER BY id ASC LIMIT 50');
  const statesRes = await query('SELECT id FROM states ORDER BY id ASC LIMIT 10');
  const religionsRes = await query('SELECT id FROM religions ORDER BY id ASC LIMIT 10');
  const castesRes = await query('SELECT id FROM castes ORDER BY id ASC LIMIT 30');
  const partiesRes = await query('SELECT id FROM parties ORDER BY id ASC LIMIT 10');

  const booths = boothsRes.rows;
  const acs = acsRes.rows;
  const pcs = pcsRes.rows;
  const districts = districtsRes.rows;
  const states = statesRes.rows;
  const religions = religionsRes.rows;
  const castes = castesRes.rows;
  const parties = partiesRes.rows;

  // Fetch real villages with taluka name
  const villagesRes = await query(`
    SELECT v.id, v.name, t.name AS taluka_name 
    FROM villages v 
    JOIN talukas t ON v.taluka_id = t.id 
    ORDER BY v.name ASC
  `);
  const villages = villagesRes.rows;

  const defaultStateId = states[0]?.id || null;
  const defaultDistrictId = districts[0]?.id || null;
  const defaultPcId = pcs[0]?.id || null;
  const defaultAcId = acs[0]?.id || null;
  const defaultBoothId = booths[0]?.id || null;
  const defaultReligionId = religions[0]?.id || null;
  const defaultCasteId = castes[0]?.id || null;
  const defaultPartyId = parties[0]?.id || null;

  // Perform Batch Insert in Chunks of 500
  const chunkSize = 500;
  let seededCount = 0;

  for (let batchStart = 0; batchStart < count; batchStart += chunkSize) {
    const batchEnd = Math.min(batchStart + chunkSize, count);
    const valueTuples: string[] = [];
    const valuesParams: any[] = [];
    let pIndex = 1;

    for (let i = batchStart; i < batchEnd; i++) {
      const householdId = Math.floor(i / 4);
      const isMale = (i % 4 === 0 || i % 4 === 2);
      const fnObj = isMale
        ? firstNamesMale[i % firstNamesMale.length]
        : firstNamesFemale[i % firstNamesFemale.length];
      const mnObj = isMale
        ? middleNamesMale[householdId % middleNamesMale.length]
        : middleNamesFemale[householdId % middleNamesFemale.length];
      const snObj = surnames[householdId % surnames.length];

      const epicNo = `RN${String(1000000 + i + 1).slice(1)}`;
      const gender = isMale ? 'Male' : 'Female';
      const age = (i % 4 === 0) ? (45 + (householdId % 25)) : (18 + ((i * 7) % 40));
      const birthYear = 2026 - age;
      const dob = `${birthYear}-0${(i % 9) + 1}-15`;
      const mobileNo = `9823${String(100000 + i).slice(0, 6)}`;
      const houseNo = `${(householdId % 120) + 1}/${String.fromCharCode(65 + (householdId % 3))}`;
      const serialNo = (i % 800) + 1;
      const sectionNo = ((Math.floor(householdId / 8)) % 5) + 1;
      const voterType = voterTypes[i % voterTypes.length];
      const status = statuses[i % statuses.length];
      const isDead = i % 47 === 0;
      const bloodGroup = bloodGroups[i % bloodGroups.length];

      // Assign to booth and inherit geographic boundary hierarchy
      const bObj = booths.length > 0 ? booths[householdId % booths.length] : null;
      const boothId = bObj?.id || defaultBoothId;
      const acId = bObj?.ac_id || defaultAcId;
      const pcId = bObj?.pc_id || defaultPcId;
      const districtId = bObj?.district_id || defaultDistrictId;
      const stateId = bObj?.state_id || defaultStateId;
      const wardId = bObj?.ward_id || null;

      const vObj = villages.length > 0 ? villages[(i * 3 + householdId) % villages.length] : null;
      const villageId = vObj?.id || null;
      const taluka = vObj?.taluka_name || 'Haveli';
      const village = vObj?.name || 'Kothrud';
      const fullAddress = `House #${houseNo}, ${village}, ${taluka}`;
      const voterAddress = `Booth Section #${sectionNo}, ${village}, ${taluka}`;

      // Canonical Family ID formatting based on booth and household number
      const boothNo = bObj?.booth_number ? String(bObj.booth_number).padStart(3, '0') : '001';
      const cleanHouse = houseNo.replace(/[^a-zA-Z0-9]/g, '');
      const familyId = `FAM-B${boothNo}-H${cleanHouse}`;

      const religionId = religions.length > 0 ? religions[householdId % religions.length]?.id : defaultReligionId;
      const casteId = castes.length > 0 ? castes[householdId % castes.length]?.id : defaultCasteId;
      const partyId = parties.length > 0 ? parties[i % parties.length]?.id : defaultPartyId;

      const isFamilyInfluencer = (i % 4 === 0);
      const isSocialInfluencer = (i % 25 === 0);

      const tuplePlaceholders = Array.from({ length: 35 }, (_, idx) => `$${pIndex + idx}`).join(', ');
      valueTuples.push(`(${tuplePlaceholders})`);

      valuesParams.push(
        epicNo,
        stateId,
        districtId,
        pcId,
        acId,
        boothId,
        wardId,
        villageId,
        serialNo,
        sectionNo,
        houseNo,
        fnObj.loc,
        fnObj.eng,
        mnObj.loc,
        mnObj.eng,
        snObj.loc,
        snObj.eng,
        gender,
        dob,
        age,
        mobileNo,
        religionId,
        casteId,
        voterType,
        status,
        isDead,
        bloodGroup,
        taluka,
        village,
        fullAddress,
        voterAddress,
        partyId,
        isFamilyInfluencer,
        isSocialInfluencer,
        familyId
      );

      pIndex += 35;
    }

    const insertSql = `
      INSERT INTO voters (
        epic_no, state_id, district_id, pc_id, ac_id, booth_id, ward_id, village_id, serial_no, section_no, house_no,
        first_name, eng_first_name, middle_name, eng_middle_name, surname, eng_surname,
        gender, dob, age, mobile_no, religion_id, caste_id, voter_type,
        status, is_dead, blood_group, taluka, village, full_address, voter_address, party_id,
        is_family_influencer, is_social_influencer, family_id
      ) VALUES 
      ${valueTuples.join(',\n')}
      ON CONFLICT (epic_no) DO UPDATE SET
        state_id = EXCLUDED.state_id,
        district_id = EXCLUDED.district_id,
        pc_id = EXCLUDED.pc_id,
        ac_id = EXCLUDED.ac_id,
        booth_id = EXCLUDED.booth_id,
        ward_id = EXCLUDED.ward_id,
        village_id = EXCLUDED.village_id,
        family_id = EXCLUDED.family_id,
        serial_no = EXCLUDED.serial_no,
        section_no = EXCLUDED.section_no,
        house_no = EXCLUDED.house_no,
        first_name = EXCLUDED.first_name,
        eng_first_name = EXCLUDED.eng_first_name,
        middle_name = EXCLUDED.middle_name,
        eng_middle_name = EXCLUDED.eng_middle_name,
        surname = EXCLUDED.surname,
        eng_surname = EXCLUDED.eng_surname,
        gender = EXCLUDED.gender,
        dob = EXCLUDED.dob,
        age = EXCLUDED.age,
        mobile_no = EXCLUDED.mobile_no,
        religion_id = EXCLUDED.religion_id,
        caste_id = EXCLUDED.caste_id,
        voter_type = EXCLUDED.voter_type,
        status = EXCLUDED.status,
        is_dead = EXCLUDED.is_dead,
        blood_group = EXCLUDED.blood_group,
        taluka = EXCLUDED.taluka,
        village = EXCLUDED.village,
        full_address = EXCLUDED.full_address,
        voter_address = EXCLUDED.voter_address,
        party_id = EXCLUDED.party_id,
        is_family_influencer = EXCLUDED.is_family_influencer,
        is_social_influencer = EXCLUDED.is_social_influencer;
    `;

    await query(insertSql, valuesParams);
    seededCount += (batchEnd - batchStart);
    logger.info(`Seeded batch ${batchStart + 1} - ${batchEnd} voters.`);
  }

  // Ensure voter ac_id and ward_id strictly match the booth
  await query(`
    UPDATE voters v
    SET ac_id = b.ac_id,
        ward_id = b.ward_id
    FROM booths b
    WHERE v.booth_id = b.id AND (v.ac_id != b.ac_id OR v.ward_id != b.ward_id OR v.ward_id IS NULL);
  `);

  // Post-Seeding: Automatically link family members to designated family influencers
  logger.info('Establishing family and social influencer connections...');

  // Reset prior auto-links to ensure clean state
  await query(`UPDATE voters SET family_influencer_id = NULL, social_influencer_id = NULL;`);

  // 1. Link household members to the family head within the same family_id
  await query(`
    WITH family_heads AS (
      SELECT DISTINCT ON (family_id, booth_id) id, family_id, booth_id
      FROM voters
      WHERE is_family_influencer = TRUE
      ORDER BY family_id, booth_id, serial_no ASC
    )
    UPDATE voters v
    SET family_influencer_id = fh.id
    FROM family_heads fh
    WHERE v.family_id = fh.family_id 
      AND v.booth_id = fh.booth_id 
      AND v.id != fh.id;
  `);

  // 2. Link voters to designated social influencers (booth-level community influence)
  await query(`
    WITH ranked_supporters AS (
      SELECT 
        v.id AS voter_id,
        si.id AS inf_id,
        ROW_NUMBER() OVER (PARTITION BY si.id ORDER BY v.serial_no ASC) as rn
      FROM voters si
      JOIN voters v ON v.booth_id = si.booth_id 
                   AND v.id != si.id
                   AND v.social_influencer_id IS NULL
      WHERE si.is_social_influencer = TRUE
    )
    UPDATE voters v
    SET social_influencer_id = rs.inf_id
    FROM ranked_supporters rs
    WHERE v.id = rs.voter_id AND rs.rn <= 6;
  `);

  // Ensure all influencers with linked members have flags set to TRUE
  await query(`
    UPDATE voters 
    SET is_family_influencer = TRUE 
    WHERE id IN (
      SELECT DISTINCT family_influencer_id 
      FROM voters 
      WHERE family_influencer_id IS NOT NULL
    );
  `);
  await query(`
    UPDATE voters 
    SET is_social_influencer = TRUE 
    WHERE id IN (
      SELECT DISTINCT social_influencer_id 
      FROM voters 
      WHERE social_influencer_id IS NOT NULL
    );
  `);

  const stats = await query(`
    SELECT 
      (SELECT COUNT(DISTINCT family_id)::int FROM voters WHERE family_id IS NOT NULL) AS "totalFamilies",
      (SELECT COUNT(*)::int FROM voters WHERE is_family_influencer = TRUE) AS "familyInfluencers",
      (SELECT COUNT(*)::int FROM voters WHERE is_social_influencer = TRUE) AS "socialInfluencers",
      (SELECT COUNT(*)::int FROM voters WHERE family_influencer_id IS NOT NULL) AS "linkedFamilyMembers",
      (SELECT COUNT(*)::int FROM voters WHERE social_influencer_id IS NOT NULL) AS "linkedSocialFollowers"
  `);

  const statRow = stats.rows[0];
  logger.info(
    `✅ Influencer Seeding Complete: ${statRow.totalFamilies} Families formed, ${statRow.familyInfluencers} Family Heads (${statRow.linkedFamilyMembers} members linked), ${statRow.socialInfluencers} Social Influencers (${statRow.linkedSocialFollowers} followers linked).`
  );

  logger.info(`Successfully Seeded ${seededCount} Voters into Database.`);
};
