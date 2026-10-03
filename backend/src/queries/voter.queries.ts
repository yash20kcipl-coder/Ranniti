import { query, dbPool } from './dbPool';
import { logger } from '../utils/logger';
import { FamilyMappingService } from '../services/familyMapping.service';
import { Voter, VoterFilterParams, VoterStats, InfluencerOption, FamilyCandidateParams, SocialCandidateParams } from '../models/voter.model';

export class VoterQueries {
  static async getVoters(params: VoterFilterParams): Promise<{
    data: Voter[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(500, params.limit || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      conditions.push(
        `(v.epic_no ILIKE $${paramIndex} OR v.eng_first_name ILIKE $${paramIndex} OR v.eng_surname ILIKE $${paramIndex} OR v.first_name ILIKE $${paramIndex} OR v.surname ILIKE $${paramIndex} OR v.mobile_no ILIKE $${paramIndex} OR v.house_no ILIKE $${paramIndex})`
      );
      values.push(searchPattern);
      paramIndex++;
    }

    if (params.boothId) {
      conditions.push(`v.booth_id = $${paramIndex}`);
      values.push(params.boothId);
      paramIndex++;
    }

    if (params.acId) {
      conditions.push(`v.ac_id = $${paramIndex}`);
      values.push(params.acId);
      paramIndex++;
    }

    if (params.pcId) {
      conditions.push(`v.pc_id = $${paramIndex}`);
      values.push(params.pcId);
      paramIndex++;
    }


    if (params.gender) {
      conditions.push(`LOWER(v.gender) = LOWER($${paramIndex})`);
      values.push(params.gender);
      paramIndex++;
    }

    if (params.voterType) {
      conditions.push(`v.voter_type = $${paramIndex}`);
      values.push(params.voterType);
      paramIndex++;
    }

    if (params.status) {
      conditions.push(`v.status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    if (params.isDead !== undefined && params.isDead !== '') {
      const isDeadBool = params.isDead === true || params.isDead === 'true';
      conditions.push(`v.is_dead = $${paramIndex}`);
      values.push(isDeadBool);
      paramIndex++;
    }

    if (params.religionId) {
      conditions.push(`v.religion_id = $${paramIndex}`);
      values.push(params.religionId);
      paramIndex++;
    }

    if (params.casteId) {
      conditions.push(`v.caste_id = $${paramIndex}`);
      values.push(params.casteId);
      paramIndex++;
    }

    if (params.stateId) {
      conditions.push(`v.state_id = $${paramIndex}`);
      values.push(params.stateId);
      paramIndex++;
    }

    if (params.districtId) {
      conditions.push(`v.district_id = $${paramIndex}`);
      values.push(params.districtId);
      paramIndex++;
    }

    if (params.partyId) {
      conditions.push(`v.party_id = $${paramIndex}`);
      values.push(params.partyId);
      paramIndex++;
    }

    if (params.ageGroup && params.ageGroup.includes('-')) {
      const [minAgeStr, maxAgeStr] = params.ageGroup.split('-');
      const minAge = parseInt(minAgeStr, 10);
      const maxAge = parseInt(maxAgeStr, 10);
      if (!isNaN(minAge) && !isNaN(maxAge)) {
        conditions.push(`v.age >= $${paramIndex} AND v.age <= $${paramIndex + 1}`);
        values.push(minAge, maxAge);
        paramIndex += 2;
      }
    }

    if (params.familyInfluencerId) {
      conditions.push(`v.family_influencer_id = $${paramIndex}`);
      values.push(params.familyInfluencerId);
      paramIndex++;
    }

    if (params.socialInfluencerId) {
      conditions.push(`v.social_influencer_id = $${paramIndex}`);
      values.push(params.socialInfluencerId);
      paramIndex++;
    }

    if (params.influencerRole === 'family') {
      conditions.push(`v.is_family_influencer = TRUE`);
    } else if (params.influencerRole === 'social') {
      conditions.push(`v.is_social_influencer = TRUE`);
    } else if (params.influencerRole === 'any') {
      conditions.push(`(v.is_family_influencer = TRUE OR v.is_social_influencer = TRUE)`);
    } else {
      if (params.isFamilyInfluencer !== undefined && params.isFamilyInfluencer !== '') {
        const isFam = params.isFamilyInfluencer === true || params.isFamilyInfluencer === 'true';
        if (isFam) {
          conditions.push(`v.is_family_influencer = TRUE`);
        }
      }

      if (params.isSocialInfluencer !== undefined && params.isSocialInfluencer !== '') {
        const isSoc = params.isSocialInfluencer === true || params.isSocialInfluencer === 'true';
        if (isSoc) {
          conditions.push(`v.is_social_influencer = TRUE`);
        }
      }
    }

    if (params.influencerStatus === 'assigned') {
      conditions.push(`(v.family_influencer_id IS NOT NULL OR v.social_influencer_id IS NOT NULL)`);
    } else if (params.influencerStatus === 'unassigned') {
      conditions.push(`(v.family_influencer_id IS NULL AND v.social_influencer_id IS NULL)`);
    }



    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch Data using Late Row Fetching (Deferred Joins)
    // The CTE filters and sorts IDs only, ensuring 11 joins and lateral counts run only on the paged 25 rows
    const sortClause = params.boothId
      ? 'v.serial_no ASC NULLS LAST, v.created_at DESC'
      : 'b.booth_number ASC NULLS LAST, v.serial_no ASC NULLS LAST, v.created_at DESC';

    const countSql = `SELECT COUNT(*)::int AS total FROM voters v ${whereClause}`;

    const dataSql = `
      WITH paged_voters AS (
        SELECT v.id
        FROM voters v
        ${params.boothId ? '' : 'LEFT JOIN booths b ON v.booth_id = b.id'}
        ${whereClause}
        ORDER BY ${sortClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      )
      SELECT 
        v.id,
        v.epic_no AS "epicNo",
        v.state_id AS "stateId",
        st.name AS "stateName",
        v.district_id AS "districtId",
        dt.name AS "districtName",
        v.pc_id AS "pcId",
        pc.name AS "pcName",
        v.ac_id AS "acId",
        ac.name AS "acName",
        v.booth_id AS "boothId",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        v.serial_no AS "serialNo",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        v.first_name AS "firstName",
        v.eng_first_name AS "engFirstName",
        v.middle_name AS "middleName",
        v.eng_middle_name AS "engMiddleName",
        v.surname AS "surname",
        v.eng_surname AS "engSurname",
        v.gender,
        v.dob,
        v.age,
        v.mobile_no AS "mobileNo",
        v.email,
        v.aadhaar_no AS "aadhaarNo",
        v.pan_no AS "panNo",
        v.profession_type AS "professionType",
        v.profession,
        v.religion_id AS "religionId",
        rel.name AS "religionName",
        v.caste_id AS "casteId",
        cst.name AS "casteName",
        v.subcaste_name AS "subcasteName",
        v.voter_type AS "voterType",

        v.status,
        v.is_dead AS "isDead",
        v.blood_group AS "bloodGroup",
        v.avatar,
        v.taluka,
        v.village,
        v.full_address AS "fullAddress",
        v.voter_address AS "voterAddress",
        v.party_id AS "partyId",
        p.name AS "partyName",
        p.abbreviation AS "partyAbbreviation",
        p.symbol_logo AS "partySymbol",
        v.family_influencer_id AS "familyInfluencerId",
        CONCAT_WS(' ', NULLIF(fi.eng_first_name, ''), NULLIF(fi.eng_middle_name, ''), NULLIF(fi.eng_surname, '')) AS "familyInfluencerName",
        fi.epic_no AS "familyInfluencerEpic",
        COALESCE(fic.cnt, 0) AS "familyInfluencedCount",
        (COALESCE(v.is_family_influencer, FALSE) OR COALESCE(fic.cnt, 0) > 0) AS "isFamilyInfluencer",
        v.social_influencer_id AS "socialInfluencerId",
        CONCAT_WS(' ', NULLIF(si.eng_first_name, ''), NULLIF(si.eng_middle_name, ''), NULLIF(si.eng_surname, '')) AS "socialInfluencerName",
        si.epic_no AS "socialInfluencerEpic",
        COALESCE(sic.cnt, 0) AS "socialInfluencedCount",
        (COALESCE(v.is_social_influencer, FALSE) OR COALESCE(sic.cnt, 0) > 0) AS "isSocialInfluencer",

        v.family_id AS "familyId",

        v.created_at AS "createdAt",
        v.updated_at AS "updatedAt"
      FROM paged_voters pv
      JOIN voters v ON pv.id = v.id
      LEFT JOIN states st ON v.state_id = st.id
      LEFT JOIN districts dt ON v.district_id = dt.id
      LEFT JOIN parliamentary_constituencies pc ON v.pc_id = pc.id
      LEFT JOIN assembly_constituencies ac ON v.ac_id = ac.id
      LEFT JOIN booths b ON v.booth_id = b.id
      LEFT JOIN religions rel ON v.religion_id = rel.id
      LEFT JOIN castes cst ON v.caste_id = cst.id
      LEFT JOIN parties p ON v.party_id = p.id
      LEFT JOIN voters fi ON v.family_influencer_id = fi.id
      LEFT JOIN voters si ON v.social_influencer_id = si.id

      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters fv WHERE fv.family_influencer_id = v.id
      ) fic ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters sv WHERE sv.social_influencer_id = v.id
      ) sic ON true
      ORDER BY ${sortClause}
    `;

    const [countRes, dataRes] = await Promise.all([
      query(countSql, values),
      query(dataSql, [...values, limit, offset]),
    ]);

    const total = countRes.rows[0]?.total || 0;

    return {
      data: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getVoterById(id: string): Promise<Voter | null> {
    const res = await query(
      `SELECT 
        v.id,
        v.epic_no AS "epicNo",
        v.state_id AS "stateId",
        st.name AS "stateName",
        v.district_id AS "districtId",
        dt.name AS "districtName",
        v.pc_id AS "pcId",
        pc.name AS "pcName",
        v.ac_id AS "acId",
        ac.name AS "acName",
        v.booth_id AS "boothId",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        v.serial_no AS "serialNo",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        v.first_name AS "firstName",
        v.eng_first_name AS "engFirstName",
        v.middle_name AS "middleName",
        v.eng_middle_name AS "engMiddleName",
        v.surname AS "surname",
        v.eng_surname AS "engSurname",
        v.gender,
        v.dob,
        v.age,
        v.mobile_no AS "mobileNo",
        v.email,
        v.aadhaar_no AS "aadhaarNo",
        v.pan_no AS "panNo",
        v.profession_type AS "professionType",
        v.profession,
        v.religion_id AS "religionId",
        rel.name AS "religionName",
        v.caste_id AS "casteId",
        cst.name AS "casteName",
        v.subcaste_name AS "subcasteName",
        v.voter_type AS "voterType",

        v.status,
        v.is_dead AS "isDead",
        v.blood_group AS "bloodGroup",
        v.avatar,
        v.taluka,
        v.village,
        v.full_address AS "fullAddress",
        v.voter_address AS "voterAddress",
        v.party_id AS "partyId",
        p.name AS "partyName",
        p.abbreviation AS "partyAbbreviation",
        p.symbol_logo AS "partySymbol",
        v.family_influencer_id AS "familyInfluencerId",
        CONCAT_WS(' ', NULLIF(fi.eng_first_name, ''), NULLIF(fi.eng_middle_name, ''), NULLIF(fi.eng_surname, '')) AS "familyInfluencerName",
        COALESCE(fic.cnt, 0) AS "familyInfluencedCount",
        (COALESCE(v.is_family_influencer, FALSE) OR COALESCE(fic.cnt, 0) > 0) AS "isFamilyInfluencer",
        v.social_influencer_id AS "socialInfluencerId",
        CONCAT_WS(' ', NULLIF(si.eng_first_name, ''), NULLIF(si.eng_middle_name, ''), NULLIF(si.eng_surname, '')) AS "socialInfluencerName",
        si.epic_no AS "socialInfluencerEpic",
        COALESCE(sic.cnt, 0) AS "socialInfluencedCount",
        (COALESCE(v.is_social_influencer, FALSE) OR COALESCE(sic.cnt, 0) > 0) AS "isSocialInfluencer",

        v.family_id AS "familyId",

        v.created_at AS "createdAt",
        v.updated_at AS "updatedAt"
      FROM voters v
      LEFT JOIN states st ON v.state_id = st.id
      LEFT JOIN districts dt ON v.district_id = dt.id
      LEFT JOIN parliamentary_constituencies pc ON v.pc_id = pc.id
      LEFT JOIN assembly_constituencies ac ON v.ac_id = ac.id
      LEFT JOIN booths b ON v.booth_id = b.id
      LEFT JOIN religions rel ON v.religion_id = rel.id
      LEFT JOIN castes cst ON v.caste_id = cst.id
      LEFT JOIN parties p ON v.party_id = p.id
      LEFT JOIN voters fi ON v.family_influencer_id = fi.id
      LEFT JOIN voters si ON v.social_influencer_id = si.id

      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters fv WHERE fv.family_influencer_id = v.id
      ) fic ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters sv WHERE sv.social_influencer_id = v.id
      ) sic ON true
      WHERE v.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async createVoter(data: Partial<Voter>): Promise<Voter> {
    const res = await query(
      `INSERT INTO voters (
        epic_no, state_id, district_id, pc_id, ac_id, booth_id, serial_no, section_no, house_no,
        first_name, eng_first_name, middle_name, eng_middle_name, surname, eng_surname,
        gender, dob, age, mobile_no, email, aadhaar_no, pan_no,
        profession_type, profession, religion_id, caste_id, subcaste_name, voter_type,
        status, is_dead, blood_group, avatar, taluka, village, full_address, voter_address,
        party_id, family_influencer_id, social_influencer_id,
        is_family_influencer, is_social_influencer, family_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36,
        $37, $38, $39, $40, $41, $42
      )
      RETURNING 
        id, epic_no AS "epicNo", serial_no AS "serialNo", section_no AS "sectionNo", house_no AS "houseNo",
        first_name AS "firstName", eng_first_name AS "engFirstName", middle_name AS "middleName", eng_middle_name AS "engMiddleName",
        surname, eng_surname AS "engSurname", gender, dob, age, mobile_no AS "mobileNo", email,
        aadhaar_no AS "aadhaarNo", pan_no AS "panNo", profession_type AS "professionType", profession,
        voter_type AS "voterType", status, is_dead AS "isDead", blood_group AS "bloodGroup", avatar,
        is_family_influencer AS "isFamilyInfluencer", is_social_influencer AS "isSocialInfluencer",
        family_id AS "familyId",
        created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.epicNo,
        data.stateId || null,
        data.districtId || null,
        data.pcId || null,
        data.acId || null,
        data.boothId || null,
        data.serialNo || null,
        data.sectionNo || null,
        data.houseNo || null,
        data.firstName || null,
        data.engFirstName || null,
        data.middleName || null,
        data.engMiddleName || null,
        data.surname || null,
        data.engSurname || null,
        data.gender || null,
        data.dob || null,
        data.age || null,
        data.mobileNo || null,
        data.email || null,
        data.aadhaarNo || null,
        data.panNo || null,
        data.professionType || null,
        data.profession || null,
        data.religionId || null,
        data.casteId || null,
        data.subcasteName || null,
        data.voterType || 'Voter',
        data.status || 'ACTIVE',
        data.isDead || false,
        data.bloodGroup || null,
        data.avatar || null,
        data.taluka || null,
        data.village || null,
        data.fullAddress || null,
        data.voterAddress || null,
        data.partyId || null,
        data.familyInfluencerId || null,
        data.socialInfluencerId || null,
        data.isFamilyInfluencer || false,
        data.isSocialInfluencer || false,
        data.familyId || null,
      ]
    );

    return res.rows[0];
  }

  /**
   * High-performance multi-row batch insert with ON CONFLICT (epic_no) DO UPDATE
   * Chunks queries in batches of 300 (safely below PostgreSQL's 65,535 parameter limit).
   * Falls back to single-row inserts for any failed chunk so valid records are never dropped.
   */
  static async createVotersBatch(votersList: Partial<Voter>[]): Promise<{ inserted: number; errors: number }> {
    if (!votersList || votersList.length === 0) {
      return { inserted: 0, errors: 0 };
    }

    const CHUNK_SIZE = 300;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < votersList.length; i += CHUNK_SIZE) {
      const chunk = votersList.slice(i, i + CHUNK_SIZE);
      const valueTuples: string[] = [];
      const valuesParams: any[] = [];
      let pIndex = 1;

      for (const data of chunk) {
        const tuplePlaceholders = Array.from({ length: 42 }, (_, idx) => `$${pIndex + idx}`).join(', ');
        valueTuples.push(`(${tuplePlaceholders})`);

        valuesParams.push(
          data.epicNo,
          data.stateId || null,
          data.districtId || null,
          data.pcId || null,
          data.acId || null,
          data.boothId || null,
          data.serialNo || null,
          data.sectionNo || null,
          data.houseNo || null,
          data.firstName || null,
          data.engFirstName || null,
          data.middleName || null,
          data.engMiddleName || null,
          data.surname || null,
          data.engSurname || null,
          data.gender || null,
          data.dob || null,
          data.age || null,
          data.mobileNo || null,
          data.email || null,
          data.aadhaarNo || null,
          data.panNo || null,
          data.professionType || null,
          data.profession || null,
          data.religionId || null,
          data.casteId || null,
          data.subcasteName || null,
          data.voterType || 'Voter',
          data.status || 'ACTIVE',
          data.isDead || false,
          data.bloodGroup || null,
          data.avatar || null,
          data.taluka || null,
          data.village || null,
          data.fullAddress || null,
          data.voterAddress || null,
          data.partyId || null,
          data.familyInfluencerId || null,
          data.socialInfluencerId || null,
          data.isFamilyInfluencer || false,
          data.isSocialInfluencer || false,
          data.familyId || null
        );

        pIndex += 42;
      }

      const sql = `
        INSERT INTO voters (
          epic_no, state_id, district_id, pc_id, ac_id, booth_id, serial_no, section_no, house_no,
          first_name, eng_first_name, middle_name, eng_middle_name, surname, eng_surname,
          gender, dob, age, mobile_no, email, aadhaar_no, pan_no,
          profession_type, profession, religion_id, caste_id, subcaste_name, voter_type,
          status, is_dead, blood_group, avatar, taluka, village, full_address, voter_address,
          party_id, family_influencer_id, social_influencer_id,
          is_family_influencer, is_social_influencer, family_id
        ) VALUES 
        ${valueTuples.join(',\n')}
        ON CONFLICT (epic_no) DO UPDATE SET
          state_id = EXCLUDED.state_id,
          district_id = EXCLUDED.district_id,
          pc_id = EXCLUDED.pc_id,
          ac_id = EXCLUDED.ac_id,
          booth_id = EXCLUDED.booth_id,
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
          email = EXCLUDED.email,
          aadhaar_no = EXCLUDED.aadhaar_no,
          pan_no = EXCLUDED.pan_no,
          profession_type = EXCLUDED.profession_type,
          profession = EXCLUDED.profession,
          religion_id = EXCLUDED.religion_id,
          caste_id = EXCLUDED.caste_id,
          subcaste_name = EXCLUDED.subcaste_name,
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
          is_social_influencer = EXCLUDED.is_social_influencer,
          family_id = COALESCE(EXCLUDED.family_id, voters.family_id),
          updated_at = NOW()
        RETURNING id
      `;

      try {
        const res = await query(sql, valuesParams);
        totalInserted += res.rowCount || res.rows.length;
      } catch (chunkErr: any) {
        logger.warn(`[VoterQueries.createVotersBatch] Chunk insert failed (${chunkErr.message}), falling back to single-row inserts...`);
        for (const singleVoter of chunk) {
          try {
            await VoterQueries.createVoter(singleVoter);
            totalInserted++;
          } catch (singleErr: any) {
            totalErrors++;
            logger.warn(`[VoterQueries.createVotersBatch] Single insert skipped for EPIC '${singleVoter.epicNo}': ${singleErr.message}`);
          }
        }
      }
    }

    return { inserted: totalInserted, errors: totalErrors };
  }

  static async updateVoter(id: string, data: Partial<Voter>): Promise<Voter | null> {
    const res = await query(
      `UPDATE voters SET
        epic_no = COALESCE($2, epic_no),
        state_id = COALESCE($3, state_id),
        district_id = COALESCE($4, district_id),
        pc_id = COALESCE($5, pc_id),
        ac_id = COALESCE($6, ac_id),
        booth_id = COALESCE($7, booth_id),
        serial_no = COALESCE($8, serial_no),
        section_no = COALESCE($9, section_no),
        house_no = COALESCE($10, house_no),
        first_name = COALESCE($11, first_name),
        eng_first_name = COALESCE($12, eng_first_name),
        middle_name = COALESCE($13, middle_name),
        eng_middle_name = COALESCE($14, eng_middle_name),
        surname = COALESCE($15, surname),
        eng_surname = COALESCE($16, eng_surname),
        gender = COALESCE($17, gender),
        dob = COALESCE($18, dob),
        age = COALESCE($19, age),
        mobile_no = COALESCE($20, mobile_no),
        email = COALESCE($21, email),
        aadhaar_no = COALESCE($22, aadhaar_no),
        pan_no = COALESCE($23, pan_no),
        profession_type = COALESCE($24, profession_type),
        profession = COALESCE($25, profession),
        religion_id = COALESCE($26, religion_id),
        caste_id = COALESCE($27, caste_id),
        subcaste_name = COALESCE($28, subcaste_name),
        voter_type = COALESCE($29, voter_type),
        status = COALESCE($30, status),
        is_dead = COALESCE($31, is_dead),
        blood_group = COALESCE($32, blood_group),
        avatar = COALESCE($33, avatar),
        taluka = COALESCE($34, taluka),
        village = COALESCE($35, village),
        full_address = COALESCE($36, full_address),
        voter_address = COALESCE($37, voter_address),
        party_id = CASE WHEN $45 = TRUE THEN $38 ELSE party_id END,
        family_influencer_id = CASE 
          WHEN COALESCE($41, is_family_influencer) = TRUE THEN NULL 
          WHEN $43 = TRUE THEN $39 
          ELSE family_influencer_id 
        END,
        social_influencer_id = CASE 
          WHEN $44 = TRUE THEN $40 
          ELSE social_influencer_id 
        END,
        is_family_influencer = CASE 
          WHEN $39 IS NOT NULL AND ($41 IS NULL OR $41 = FALSE) THEN FALSE 
          ELSE COALESCE($41, is_family_influencer) 
        END,
        is_social_influencer = COALESCE($42, is_social_influencer),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, epic_no AS "epicNo", updated_at AS "updatedAt"`,
      [
        id,
        data.epicNo !== undefined ? data.epicNo : null,
        data.stateId !== undefined ? data.stateId : null,
        data.districtId !== undefined ? data.districtId : null,
        data.pcId !== undefined ? data.pcId : null,
        data.acId !== undefined ? data.acId : null,
        data.boothId !== undefined ? data.boothId : null,
        data.serialNo !== undefined ? data.serialNo : null,
        data.sectionNo !== undefined ? data.sectionNo : null,
        data.houseNo !== undefined ? data.houseNo : null,
        data.firstName !== undefined ? data.firstName : null,
        data.engFirstName !== undefined ? data.engFirstName : null,
        data.middleName !== undefined ? data.middleName : null,
        data.engMiddleName !== undefined ? data.engMiddleName : null,
        data.surname !== undefined ? data.surname : null,
        data.engSurname !== undefined ? data.engSurname : null,
        data.gender !== undefined ? data.gender : null,
        data.dob !== undefined ? data.dob : null,
        data.age !== undefined ? data.age : null,
        data.mobileNo !== undefined ? data.mobileNo : null,
        data.email !== undefined ? data.email : null,
        data.aadhaarNo !== undefined ? data.aadhaarNo : null,
        data.panNo !== undefined ? data.panNo : null,
        data.professionType !== undefined ? data.professionType : null,
        data.profession !== undefined ? data.profession : null,
        data.religionId !== undefined ? data.religionId : null,
        data.casteId !== undefined ? data.casteId : null,
        data.subcasteName !== undefined ? data.subcasteName : null,
        data.voterType !== undefined ? data.voterType : null,
        data.status !== undefined ? data.status : null,
        data.isDead !== undefined ? data.isDead : null,
        data.bloodGroup !== undefined ? data.bloodGroup : null,
        data.avatar !== undefined ? data.avatar : null,
        data.taluka !== undefined ? data.taluka : null,
        data.village !== undefined ? data.village : null,
        data.fullAddress !== undefined ? data.fullAddress : null,
        data.voterAddress !== undefined ? data.voterAddress : null,
        data.partyId !== undefined ? data.partyId : null,
        data.familyInfluencerId !== undefined ? data.familyInfluencerId : null,
        data.socialInfluencerId !== undefined ? data.socialInfluencerId : null,
        data.isFamilyInfluencer !== undefined ? data.isFamilyInfluencer : null,
        data.isSocialInfluencer !== undefined ? data.isSocialInfluencer : null,
        data.familyInfluencerId !== undefined,
        data.socialInfluencerId !== undefined,
        data.partyId !== undefined,
      ]
    );

    if (!res.rows[0]) return null;

    if (data.isFamilyInfluencer === false) {
      await query(`UPDATE voters SET family_influencer_id = NULL WHERE family_influencer_id = $1`, [id]);
    }
    if (data.isSocialInfluencer === false) {
      await query(`UPDATE voters SET social_influencer_id = NULL WHERE social_influencer_id = $1`, [id]);
    }

    return this.getVoterById(id);
  }

  static async getInfluencerOptions(
    search?: string,
    boothId?: string,
    excludeId?: string,
    type?: string
  ): Promise<InfluencerOption[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (excludeId) {
      conditions.push(`v.id != $${paramIndex}`);
      values.push(excludeId);
      paramIndex++;
    }

    if (boothId) {
      conditions.push(`v.booth_id = $${paramIndex}`);
      values.push(boothId);
      paramIndex++;
    }

    if (type === 'family') {
      conditions.push(`v.is_family_influencer = TRUE`);
    } else if (type === 'social') {
      conditions.push(`v.is_social_influencer = TRUE`);
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        `(v.epic_no ILIKE $${paramIndex} OR v.eng_first_name ILIKE $${paramIndex} OR v.eng_middle_name ILIKE $${paramIndex} OR v.eng_surname ILIKE $${paramIndex} OR v.first_name ILIKE $${paramIndex} OR v.middle_name ILIKE $${paramIndex} OR v.surname ILIKE $${paramIndex} OR v.house_no ILIKE $${paramIndex})`
      );
      values.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        v.id,
        v.epic_no AS "epicNo",
        CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS name,
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "engName",
        v.first_name AS "firstName",
        v.eng_first_name AS "engFirstName",
        v.middle_name AS "middleName",
        v.eng_middle_name AS "engMiddleName",
        v.surname AS "surname",
        v.eng_surname AS "engSurname",
        v.house_no AS "houseNo",
        b.name AS "boothName"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      ${whereClause}
      ORDER BY v.eng_first_name ASC, v.eng_middle_name ASC, v.eng_surname ASC
      LIMIT 50
    `;

    const res = await query(sql, values);
    return res.rows;
  }

  static async bulkAssignInfluencer(
    influencerId: string | null,
    influencerType: 'family' | 'social',
    voterIds: string[]
  ): Promise<number> {
    if (!voterIds || voterIds.length === 0) return 0;

    if (influencerType === 'social') {
      const res = await query(
        `UPDATE voters 
         SET social_influencer_id = $1, updated_at = NOW() 
         WHERE id = ANY($2::uuid[])`,
        [influencerId, voterIds]
      );

      if (influencerId) {
        await query(
          `UPDATE voters SET is_social_influencer = TRUE, updated_at = NOW() WHERE id = $1`,
          [influencerId]
        );
      }
      return res.rowCount || 0;
    }

    // --- Family Influencer Assignment ---
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      if (!influencerId) {
        // Unlinking family influencer
        const res = await client.query(
          `UPDATE voters 
           SET family_influencer_id = NULL, updated_at = NOW() 
           WHERE id = ANY($1::uuid[])`,
          [voterIds]
        );
        await client.query('COMMIT');
        return res.rowCount || 0;
      }

      // 1. Fetch Influencer Details
      const infRes = await client.query(
        `SELECT v.id, v.family_id AS "familyId", v.booth_id AS "boothId", v.house_no AS "houseNo",
                v.age, v.gender, v.first_name AS "firstName", v.eng_first_name AS "engFirstName",
                v.middle_name AS "middleName", v.eng_middle_name AS "engMiddleName",
                v.surname, v.eng_surname AS "engSurname", b.booth_number AS "boothNumber"
         FROM voters v
         LEFT JOIN booths b ON v.booth_id = b.id
         WHERE v.id = $1`,
        [influencerId]
      );
      const influencer = infRes.rows[0];
      if (!influencer) {
        await client.query('ROLLBACK');
        return 0;
      }

      let familyId = influencer.familyId;
      if (!familyId) {
        const boothNo = influencer.boothNumber ? String(influencer.boothNumber).padStart(3, '0') : '000';
        const cleanHouse = (influencer.houseNo || 'NA').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const randomSeq = Math.floor(100 + Math.random() * 900);
        familyId = `FAM-B${boothNo}-H${cleanHouse || 'NA'}-${randomSeq}`;

        await client.query(
          `UPDATE voters 
           SET family_id = $1, is_family_influencer = TRUE, family_influencer_id = NULL, updated_at = NOW()
           WHERE id = $2`,
          [familyId, influencerId]
        );
      } else {
        await client.query(
          `UPDATE voters 
           SET is_family_influencer = TRUE, family_influencer_id = NULL, updated_at = NOW()
           WHERE id = $1`,
          [influencerId]
        );
      }

      // 2. Fetch target voters details
      const targetRes = await client.query(
        `SELECT id
         FROM voters
         WHERE id = ANY($1::uuid[]) AND (is_family_influencer IS NOT TRUE)`,
        [voterIds]
      );
      const targetVoters = targetRes.rows;

      let updatedCount = 0;
      for (const member of targetVoters) {
        await client.query(
          `UPDATE voters
           SET family_influencer_id = $1, family_id = $2, updated_at = NOW()
           WHERE id = $3`,
          [influencerId, familyId, member.id]
        );
        updatedCount++;
      }

      await client.query('COMMIT');
      return updatedCount;
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async deleteVoter(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM voters WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }

  static async getVoterStats(params: Partial<VoterFilterParams>): Promise<VoterStats> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.boothId) {
      conditions.push(`booth_id = $${paramIndex}`);
      values.push(params.boothId);
      paramIndex++;
    }

    if (params.acId) {
      conditions.push(`ac_id = $${paramIndex}`);
      values.push(params.acId);
      paramIndex++;
    }

    if (params.pcId) {
      conditions.push(`pc_id = $${paramIndex}`);
      values.push(params.pcId);
      paramIndex++;
    }

    if (params.districtId) {
      conditions.push(`district_id = $${paramIndex}`);
      values.push(params.districtId);
      paramIndex++;
    }

    if (params.stateId) {
      conditions.push(`state_id = $${paramIndex}`);
      values.push(params.stateId);
      paramIndex++;
    }




    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      WITH filtered_voters AS (
        SELECT gender, voter_type
        FROM voters
        ${whereClause}
      )
      SELECT 
        COUNT(*)::int AS "totalVoters",
        COUNT(*) FILTER (WHERE LOWER(gender) = 'male')::int AS "maleVoters",
        COUNT(*) FILTER (WHERE LOWER(gender) = 'female')::int AS "femaleVoters",
        COUNT(*) FILTER (WHERE LOWER(gender) NOT IN ('male', 'female'))::int AS "otherVoters",
        (
          SELECT COALESCE(json_object_agg(voter_type, cnt), '{}'::json)
          FROM (
            SELECT voter_type, COUNT(*)::int AS cnt
            FROM filtered_voters
            WHERE voter_type IS NOT NULL
            GROUP BY voter_type
          ) t
        ) AS "voterTypeCounts"
      FROM filtered_voters;
    `;

    const res = await query(sql, values);
    const stats = res.rows[0] || {
      totalVoters: 0,
      maleVoters: 0,
      femaleVoters: 0,
      otherVoters: 0,
      voterTypeCounts: {},
    };

    return {
      totalVoters: stats.totalVoters || 0,
      maleVoters: stats.maleVoters || 0,
      femaleVoters: stats.femaleVoters || 0,
      otherVoters: stats.otherVoters || 0,
      voterTypeCounts: stats.voterTypeCounts || {},
    };
  }

  static async getVotersForExport(params: VoterFilterParams, page: number = 1, limit: number = 5000): Promise<any[]> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      conditions.push(
        `(v.epic_no ILIKE $${paramIndex} OR v.eng_first_name ILIKE $${paramIndex} OR v.eng_surname ILIKE $${paramIndex} OR v.first_name ILIKE $${paramIndex} OR v.surname ILIKE $${paramIndex} OR v.mobile_no ILIKE $${paramIndex} OR v.house_no ILIKE $${paramIndex})`
      );
      values.push(searchPattern);
      paramIndex++;
    }

    if (params.boothId) {
      conditions.push(`v.booth_id = $${paramIndex}`);
      values.push(params.boothId);
      paramIndex++;
    }

    if (params.acId) {
      conditions.push(`v.ac_id = $${paramIndex}`);
      values.push(params.acId);
      paramIndex++;
    }

    if (params.gender) {
      conditions.push(`v.gender ILIKE $${paramIndex}`);
      values.push(params.gender);
      paramIndex++;
    }

    if (params.voterType) {
      conditions.push(`v.voter_type = $${paramIndex}`);
      values.push(params.voterType);
      paramIndex++;
    }

    if (params.religionId) {
      conditions.push(`v.religion_id = $${paramIndex}`);
      values.push(params.religionId);
      paramIndex++;
    }

    if (params.casteId) {
      conditions.push(`v.caste_id = $${paramIndex}`);
      values.push(params.casteId);
      paramIndex++;
    }



    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        v.id,
        v.epic_no AS "epicNo",
        st.name AS "stateName",
        dt.name AS "districtName",
        pc.name AS "pcName",
        ac.name AS "acName",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        v.serial_no AS "serialNo",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        v.first_name AS "firstName",
        v.eng_first_name AS "engFirstName",
        v.middle_name AS "middleName",
        v.eng_middle_name AS "engMiddleName",
        v.surname AS "surname",
        v.eng_surname AS "engSurname",
        v.gender,
        v.dob,
        v.age,
        v.mobile_no AS "mobileNo",
        v.email,
        v.aadhaar_no AS "aadhaarNo",
        v.pan_no AS "panNo",
        v.profession_type AS "professionType",
        v.profession,
        rel.name AS "religionName",
        cst.name AS "casteName",
        v.subcaste_name AS "subcasteName",
        v.voter_type AS "voterType",
        v.status,
        v.is_dead AS "isDead",
        v.blood_group AS "bloodGroup",
        v.taluka,
        v.village,
        v.full_address AS "fullAddress",
        v.voter_address AS "voterAddress",
        p.name AS "partyName",
        CONCAT_WS(' ', NULLIF(fi.eng_first_name, ''), NULLIF(fi.eng_middle_name, ''), NULLIF(fi.eng_surname, '')) AS "familyInfluencerName",
        CONCAT_WS(' ', NULLIF(si.eng_first_name, ''), NULLIF(si.eng_middle_name, ''), NULLIF(si.eng_surname, '')) AS "socialInfluencerName",
        COALESCE(fic.cnt, 0) AS "familyInfluencedCount",
        COALESCE(sic.cnt, 0) AS "socialInfluencedCount"
      FROM voters v
      LEFT JOIN states st ON v.state_id = st.id
      LEFT JOIN districts dt ON v.district_id = dt.id
      LEFT JOIN parliamentary_constituencies pc ON v.pc_id = pc.id
      LEFT JOIN assembly_constituencies ac ON v.ac_id = ac.id
      LEFT JOIN booths b ON v.booth_id = b.id
      LEFT JOIN religions rel ON v.religion_id = rel.id
      LEFT JOIN castes cst ON v.caste_id = cst.id
      LEFT JOIN parties p ON v.party_id = p.id
      LEFT JOIN voters fi ON v.family_influencer_id = fi.id
      LEFT JOIN voters si ON v.social_influencer_id = si.id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters fv WHERE fv.family_influencer_id = v.id
      ) fic ON (v.is_family_influencer = TRUE)
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters sv WHERE sv.social_influencer_id = v.id
      ) sic ON (v.is_social_influencer = TRUE)
      ${whereClause}
      ORDER BY b.booth_number ASC NULLS LAST, v.serial_no ASC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const res = await query(sql, [...values, limit, offset]);
    return res.rows;
  }

  static async getFamilyCandidates(params: FamilyCandidateParams): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    influencer: any;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;

    // 1. Fetch influencer metadata
    const influencerSql = `
      SELECT 
        v.id,
        v.epic_no AS "epicNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "engName",
        CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS "name",
        v.surname,
        v.eng_surname AS "engSurname",
        v.booth_id AS "boothId",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        v.avatar,
        (SELECT COUNT(*)::int FROM voters fv WHERE fv.family_influencer_id = v.id) AS "familyInfluencedCount"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      WHERE v.id = $1
    `;
    const infRes = await query(influencerSql, [params.influencerId]);
    const influencer = infRes.rows[0] || null;

    const influencerHouseNo = influencer?.houseNo ? String(influencer.houseNo).trim() : null;
    const influencerSurname = influencer?.surname ? String(influencer.surname).trim() : null;
    const influencerEngSurname = influencer?.engSurname ? String(influencer.engSurname).trim() : null;
    const activeBoothId = params.boothId || influencer?.boothId || null;

    // 2. Build candidate conditions (a family influencer cannot be under another family influencer)
    const conditions: string[] = ['v.id != $1', '(v.is_family_influencer IS NOT TRUE)'];
    const values: any[] = [params.influencerId];
    let paramIndex = 2;

    if (activeBoothId) {
      conditions.push(`v.booth_id = $${paramIndex}`);
      values.push(activeBoothId);
      paramIndex++;
    }

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      conditions.push(
        `(v.epic_no ILIKE $${paramIndex} OR v.eng_first_name ILIKE $${paramIndex} OR v.eng_middle_name ILIKE $${paramIndex} OR v.eng_surname ILIKE $${paramIndex} OR v.first_name ILIKE $${paramIndex} OR v.middle_name ILIKE $${paramIndex} OR v.surname ILIKE $${paramIndex} OR v.mobile_no ILIKE $${paramIndex} OR v.house_no ILIKE $${paramIndex} OR v.serial_no::text ILIKE $${paramIndex})`
      );
      values.push(searchPattern);
      paramIndex++;
    }

    if (params.sameHouseOnly === true || params.sameHouseOnly === 'true') {
      if (influencerHouseNo) {
        conditions.push(`v.house_no IS NOT NULL AND LOWER(TRIM(v.house_no)) = LOWER(TRIM($${paramIndex}))`);
        values.push(influencerHouseNo);
        paramIndex++;
      }
    } else if (params.houseNo && params.houseNo.trim()) {
      conditions.push(`LOWER(TRIM(v.house_no)) = LOWER(TRIM($${paramIndex}))`);
      values.push(params.houseNo.trim());
      paramIndex++;
    }

    if (params.sameSurnameOnly === true || params.sameSurnameOnly === 'true') {
      const surnameConditions: string[] = [];
      if (influencerSurname) {
        surnameConditions.push(`LOWER(TRIM(v.surname)) = LOWER(TRIM($${paramIndex}))`);
        values.push(influencerSurname);
        paramIndex++;
      }
      if (influencerEngSurname) {
        surnameConditions.push(`LOWER(TRIM(v.eng_surname)) = LOWER(TRIM($${paramIndex}))`);
        values.push(influencerEngSurname);
        paramIndex++;
      }
      if (surnameConditions.length > 0) {
        conditions.push(`(${surnameConditions.join(' OR ')})`);
      }
    }

    if (params.unassignedOnly === true || params.unassignedOnly === 'true') {
      conditions.push(`v.family_influencer_id IS NULL`);
    }

    if (params.sectionNo !== undefined && params.sectionNo !== '') {
      conditions.push(`v.section_no = $${paramIndex}`);
      values.push(Number(params.sectionNo));
      paramIndex++;
    }

    if (params.gender && params.gender.trim()) {
      conditions.push(`v.gender ILIKE $${paramIndex}`);
      values.push(params.gender.trim());
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 3. Count total
    const countSql = `SELECT COUNT(*)::int AS total FROM voters v ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // 4. Smart Order Priority:
    let sameHouseCase = '1';
    let sameSurnameCase = '1';

    if (influencerHouseNo) {
      sameHouseCase = `CASE WHEN v.house_no IS NOT NULL AND LOWER(TRIM(v.house_no)) = LOWER(TRIM('${influencerHouseNo.replace(/'/g, "''")}')) THEN 0 ELSE 1 END`;
    }
    if (influencerSurname || influencerEngSurname) {
      const surnameChecks: string[] = [];
      if (influencerSurname) surnameChecks.push(`LOWER(TRIM(v.surname)) = LOWER(TRIM('${influencerSurname.replace(/'/g, "''")}'))`);
      if (influencerEngSurname) surnameChecks.push(`LOWER(TRIM(v.eng_surname)) = LOWER(TRIM('${influencerEngSurname.replace(/'/g, "''")}'))`);
      sameSurnameCase = `CASE WHEN (${surnameChecks.join(' OR ')}) THEN 0 ELSE 1 END`;
    }

    const dataSql = `
      SELECT 
        v.id,
        v.epic_no AS "epicNo",
        v.serial_no AS "serialNo",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        v.first_name AS "firstName",
        v.eng_first_name AS "engFirstName",
        v.middle_name AS "middleName",
        v.eng_middle_name AS "engMiddleName",
        v.surname AS "surname",
        v.eng_surname AS "engSurname",
        v.gender,
        v.age,
        v.mobile_no AS "mobileNo",
        v.avatar,
        v.booth_id AS "boothId",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        v.family_influencer_id AS "familyInfluencerId",
        CONCAT_WS(' ', NULLIF(fi.eng_first_name, ''), NULLIF(fi.eng_middle_name, ''), NULLIF(fi.eng_surname, '')) AS "familyInfluencerName",
        (v.family_influencer_id IS NOT NULL) AS "isAlreadyLinked",
        ${influencerHouseNo ? `(v.house_no IS NOT NULL AND LOWER(TRIM(v.house_no)) = LOWER(TRIM('${influencerHouseNo.replace(/'/g, "''")}')))` : 'FALSE'} AS "isSameHouse",
        ${(influencerSurname || influencerEngSurname) ? `((v.surname IS NOT NULL AND LOWER(TRIM(v.surname)) = LOWER(TRIM('${(influencerSurname || '').replace(/'/g, "''")}'))) OR (v.eng_surname IS NOT NULL AND LOWER(TRIM(v.eng_surname)) = LOWER(TRIM('${(influencerEngSurname || '').replace(/'/g, "''")}'))))` : 'FALSE'} AS "isSameSurname"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      LEFT JOIN voters fi ON v.family_influencer_id = fi.id
      ${whereClause}
      ORDER BY 
        ${sameHouseCase} ASC,
        ${sameSurnameCase} ASC,
        v.serial_no ASC NULLS LAST,
        v.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return {
      data: dataRes.rows,
      total,
      page,
      limit,
      totalPages,
      influencer,
    };
  }

  static async getSocialCandidates(params: SocialCandidateParams): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    influencer: any;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;

    // 1. Fetch influencer metadata
    const influencerSql = `
      SELECT 
        v.id,
        v.epic_no AS "epicNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "engName",
        CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS "name",
        v.booth_id AS "boothId",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        v.avatar,
        (SELECT COUNT(*)::int FROM voters sv WHERE sv.social_influencer_id = v.id) AS "socialInfluencedCount"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      WHERE v.id = $1
    `;
    const infRes = await query(influencerSql, [params.influencerId]);
    const influencer = infRes.rows[0] || null;

    const activeBoothId = params.boothId || influencer?.boothId || null;
    const influencerSectionNo = influencer?.sectionNo;

    // 2. Build candidate conditions
    const conditions: string[] = ['v.id != $1'];
    const values: any[] = [params.influencerId];
    let paramIndex = 2;

    if (activeBoothId) {
      conditions.push(`v.booth_id = $${paramIndex}`);
      values.push(activeBoothId);
      paramIndex++;
    }

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      conditions.push(
        `(v.epic_no ILIKE $${paramIndex} OR v.eng_first_name ILIKE $${paramIndex} OR v.eng_middle_name ILIKE $${paramIndex} OR v.eng_surname ILIKE $${paramIndex} OR v.first_name ILIKE $${paramIndex} OR v.middle_name ILIKE $${paramIndex} OR v.surname ILIKE $${paramIndex} OR v.mobile_no ILIKE $${paramIndex} OR v.house_no ILIKE $${paramIndex} OR v.serial_no::text ILIKE $${paramIndex})`
      );
      values.push(searchPattern);
      paramIndex++;
    }

    if (params.sectionNo !== undefined && params.sectionNo !== '') {
      conditions.push(`v.section_no = $${paramIndex}`);
      values.push(Number(params.sectionNo));
      paramIndex++;
    }

    if (params.unassignedOnly === true || params.unassignedOnly === 'true') {
      conditions.push(`v.social_influencer_id IS NULL`);
    }

    if (params.gender && params.gender.trim()) {
      conditions.push(`v.gender ILIKE $${paramIndex}`);
      values.push(params.gender.trim());
      paramIndex++;
    }

    if (params.voterType && params.voterType.trim()) {
      conditions.push(`v.voter_type = $${paramIndex}`);
      values.push(params.voterType.trim());
      paramIndex++;
    }

    if (params.casteId && params.casteId.trim()) {
      conditions.push(`v.caste_id = $${paramIndex}`);
      values.push(params.casteId.trim());
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 3. Count total
    const countSql = `SELECT COUNT(*)::int AS total FROM voters v ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // 4. Smart Order Priority: matching section first, then serial number
    const sameSectionCase = (influencerSectionNo !== undefined && influencerSectionNo !== null && !isNaN(Number(influencerSectionNo)))
      ? `CASE WHEN v.section_no = ${Number(influencerSectionNo)} THEN 0 ELSE 1 END`
      : '1';

    const dataSql = `
      SELECT 
        v.id,
        v.epic_no AS "epicNo",
        v.serial_no AS "serialNo",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        v.first_name AS "firstName",
        v.eng_first_name AS "engFirstName",
        v.middle_name AS "middleName",
        v.eng_middle_name AS "engMiddleName",
        v.surname AS "surname",
        v.eng_surname AS "engSurname",
        v.gender,
        v.age,
        v.mobile_no AS "mobileNo",
        v.voter_type AS "voterType",
        c.name AS "casteName",
        v.avatar,
        v.booth_id AS "boothId",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        v.social_influencer_id AS "socialInfluencerId",
        CONCAT_WS(' ', NULLIF(si.eng_first_name, ''), NULLIF(si.eng_middle_name, ''), NULLIF(si.eng_surname, '')) AS "socialInfluencerName",
        (v.social_influencer_id IS NOT NULL) AS "isAlreadyLinked",
        ${(influencerSectionNo !== undefined && influencerSectionNo !== null && !isNaN(Number(influencerSectionNo))) ? `(v.section_no = ${Number(influencerSectionNo)})` : 'FALSE'} AS "isSameSection"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      LEFT JOIN castes c ON v.caste_id = c.id
      LEFT JOIN voters si ON v.social_influencer_id = si.id
      ${whereClause}
      ORDER BY 
        ${sameSectionCase} ASC,
        v.serial_no ASC NULLS LAST,
        v.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return {
      data: dataRes.rows,
      total,
      page,
      limit,
      totalPages,
      influencer,
    };
  }
}

