import { logger } from '../../utils/logger';
import { dbPool, query } from '../../queries/dbPool';
import { Voter, AutoMapFamiliesParams, AutoMapFamiliesResult } from '../../models/voter.model';

export class FamilyMappingService {
  /**
   * Normalize house number (e.g. "H.No. 12 / A" -> "12A", "Flat-302" -> "302")
   */
  static normalizeHouseNo(houseNo?: string | null): string {
    if (!houseNo) return '';
    return houseNo
      .toUpperCase()
      .replace(/^(H\.?NO\.?|HOUSE\s*NO\.?|FLAT\s*NO\.?|PLOT\s*NO\.?|H\.?\s*N\.?)\s*/i, '')
      .replace(/[\s\/\-\.\,\#]/g, '')
      .trim();
  }

  /**
   * Normalize address string for fuzzy comparison
   */
  static normalizeAddress(address?: string | null): string {
    if (!address) return '';
    return address
      .toLowerCase()
      .replace(/\b(near|opp|opposite|road|rd|gali|lane|nagar|colony|mohalla|post|dist|district|pin|taluka|village)\b/gi, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 3-Tier Family Relation Inference Engine
   */
  static inferFamilyRelation(head: any, member: any): string {
    if (member.id === head.id) return 'Head';

    const headAge = Number(head.age) || 0;
    const memberAge = Number(member.age) || 0;
    const ageDiff = headAge - memberAge; // positive = head is older, negative = member is older

    const headFirstName = (head.firstName || head.engFirstName || '').trim().toLowerCase();
    const headMiddleName = (head.middleName || head.engMiddleName || '').trim().toLowerCase();
    const memberFirstName = (member.firstName || member.engFirstName || '').trim().toLowerCase();
    const memberMiddleName = (member.middleName || member.engMiddleName || '').trim().toLowerCase();
    const memberGender = (member.gender || '').trim().toUpperCase();
    const headGender = (head.gender || '').trim().toUpperCase();

    // --- Tier 1 & 2A: Middle Name Matching (Indian naming convention) ---
    // Member's middle name matches Head's first name
    if (headFirstName && memberMiddleName && (memberMiddleName.includes(headFirstName) || headFirstName.includes(memberMiddleName))) {
      // If female and close in age, likely wife/spouse
      if (memberGender.startsWith('F') && Math.abs(ageDiff) <= 12) {
        return 'Spouse';
      }
      // If younger by 15+ years, son or daughter
      if (ageDiff >= 15) {
        return memberGender.startsWith('F') ? 'Daughter' : 'Son';
      }
    }

    // Head's middle name matches Member's first name -> Member is likely Parent
    if (headMiddleName && memberFirstName && (headMiddleName.includes(memberFirstName) || memberFirstName.includes(headMiddleName))) {
      if (ageDiff <= -15) {
        return 'Parent';
      }
    }

    // --- Tier 2B: Age Gap & Gender Heuristics ---
    if (headAge > 0 && memberAge > 0) {
      // Spouse: Opposite gender and close in age (within 12 years)
      if (memberGender && headGender && memberGender !== headGender && Math.abs(ageDiff) <= 12) {
        return 'Spouse';
      }

      // Sibling: Same gender, close in age (within 10 years)
      if (memberGender && headGender && memberGender === headGender && Math.abs(ageDiff) <= 10) {
        return 'Sibling';
      }

      // Children: Member is significantly younger (15+ years)
      if (ageDiff >= 15) {
        if (memberGender.startsWith('F')) return 'Daughter';
        if (memberGender.startsWith('M')) return 'Son';
        return 'Son';
      }

      // Parents: Member is significantly older (15+ years)
      if (ageDiff <= -15) {
        return 'Parent';
      }
    }

    return 'Member';
  }

  /**
   * Auto-elect Head of Family (Family Influencer) for a household cluster
   */
  static electFamilyHead(voters: any[]): any {
    if (!voters || voters.length === 0) return null;
    if (voters.length === 1) return voters[0];

    // Priority 1: Existing designated family influencer
    const existingHead = voters.find((v) => v.isFamilyInfluencer === true || v.is_family_influencer === true);
    if (existingHead) return existingHead;

    // Priority 2: Guardian frequency (voter whose firstName is middleName of most other voters)
    let bestGuardianCandidate: any = null;
    let maxGuardianMatches = 0;

    for (const candidate of voters) {
      const cName = (candidate.firstName || candidate.engFirstName || '').trim().toLowerCase();
      if (!cName || cName.length < 3) continue;

      let matchCount = 0;
      for (const other of voters) {
        if (other.id === candidate.id) continue;
        const otherMiddle = (other.middleName || other.engMiddleName || '').trim().toLowerCase();
        if (otherMiddle && (otherMiddle.includes(cName) || cName.includes(otherMiddle))) {
          matchCount++;
        }
      }

      if (matchCount > maxGuardianMatches) {
        maxGuardianMatches = matchCount;
        bestGuardianCandidate = candidate;
      }
    }

    if (bestGuardianCandidate && maxGuardianMatches > 0) {
      return bestGuardianCandidate;
    }

    // Priority 3: Seniority (Eldest adult, ideally aged 40-75, with mobile number)
    const candidatesWithPhone = voters.filter((v) => v.mobileNo || v.mobile_no);
    const pool = candidatesWithPhone.length > 0 ? candidatesWithPhone : voters;

    // Sort by age DESC
    const sortedByAge = [...pool].sort((a, b) => {
      const ageA = Number(a.age) || 0;
      const ageB = Number(b.age) || 0;
      return ageB - ageA;
    });

    return sortedByAge[0] || voters[0];
  }

  /**
   * Automatically resolve or assign family_id, family_influencer_id, and family_relation for a single voter.
   */
  static async assignVoterToFamily(voterData: Partial<Voter>): Promise<{
    familyId: string;
    isFamilyInfluencer: boolean;
    familyInfluencerId: string | null;
    familyRelation: string;
  }> {
    const boothId = voterData.boothId;
    const normHouse = FamilyMappingService.normalizeHouseNo(voterData.houseNo);

    if (boothId && (normHouse || voterData.mobileNo)) {
      let searchSql = `
        SELECT 
          id, epic_no AS "epicNo", house_no AS "houseNo",
          first_name AS "firstName", eng_first_name AS "engFirstName",
          middle_name AS "middleName", eng_middle_name AS "engMiddleName",
          surname, eng_surname AS "engSurname", gender, age,
          mobile_no AS "mobileNo", is_family_influencer AS "isFamilyInfluencer",
          family_influencer_id AS "familyInfluencerId", family_id AS "familyId"
        FROM voters
        WHERE booth_id = $1 AND (is_dead IS NOT TRUE)
      `;
      const params: any[] = [boothId];

      if (normHouse && normHouse !== '0' && normHouse !== '00') {
        searchSql += ` AND (UPPER(REGEXP_REPLACE(house_no, '[^a-zA-Z0-9]', '', 'g')) = $2)`;
        params.push(normHouse);
      } else if (voterData.mobileNo && voterData.mobileNo.trim().length === 10) {
        searchSql += ` AND (mobile_no = $2)`;
        params.push(voterData.mobileNo.trim());
      } else {
        searchSql += ` AND FALSE`;
      }

      const existingRes = await query(searchSql, params);
      const existingVoters: any[] = existingRes.rows;

      if (existingVoters.length > 0) {
        const head = FamilyMappingService.electFamilyHead(existingVoters);
        if (head && head.familyId) {
          const isHead = voterData.isFamilyInfluencer === true;
          const relation = isHead ? 'Head' : FamilyMappingService.inferFamilyRelation(head, voterData);
          return {
            familyId: head.familyId,
            isFamilyInfluencer: isHead,
            familyInfluencerId: isHead ? null : head.id,
            familyRelation: relation,
          };
        }
      }
    }

    let boothNumber = '000';
    if (boothId) {
      const bRes = await query(`SELECT booth_number FROM booths WHERE id = $1`, [boothId]);
      if (bRes.rows[0]?.booth_number) {
        boothNumber = String(bRes.rows[0].booth_number).padStart(3, '0');
      }
    }

    const cleanHouse = normHouse || 'NA';
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const familyCode = `FAM-B${boothNumber}-H${cleanHouse}-${randomSeq}`;

    return {
      familyId: familyCode,
      isFamilyInfluencer: voterData.isFamilyInfluencer ?? true,
      familyInfluencerId: null,
      familyRelation: 'Head',
    };
  }

  /**
   * Run automated Family Mapping algorithm for a Polling Booth
   */
  static async autoMapBoothFamilies(params: AutoMapFamiliesParams): Promise<AutoMapFamiliesResult> {
    const { boothId, dryRun = false } = params;

    // 1. Fetch all voters in this booth
    const sql = `
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
        v.voter_address AS "voterAddress",
        v.party_id AS "partyId",
        v.voter_type AS "voterType",
        v.is_family_influencer AS "isFamilyInfluencer",
        v.family_influencer_id AS "familyInfluencerId",
        v.family_id AS "familyId",
        'Member' AS "familyRelation",
        b.booth_number AS "boothNumber"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      WHERE v.booth_id = $1 AND (v.is_dead IS NOT TRUE)
      ORDER BY v.serial_no ASC
    `;

    const res = await query(sql, [boothId]);
    const allVoters: any[] = res.rows;
    const totalVoters = allVoters.length;

    if (totalVoters === 0) {
      return {
        boothId,
        totalVoters: 0,
        familiesCreated: 0,
        votersMapped: 0,
        unmappedVoters: 0,
        previewFamilies: [],
      };
    }

    const boothNumber = allVoters[0]?.boothNumber ? String(allVoters[0].boothNumber).padStart(3, '0') : '000';

    // 2. Cluster voters into household groups
    const clusters: Map<string, any[]> = new Map();

    for (const v of allVoters) {
      const normHouse = FamilyMappingService.normalizeHouseNo(v.houseNo);
      let clusterKey: string;

      if (normHouse && normHouse !== '0' && normHouse !== '00') {
        // Primary grouping key: Booth + Normalized House No
        clusterKey = `HOUSE_${normHouse}`;
      } else {
        // Fallback for missing or '0' house numbers: Surname + Phone or Address
        const normAddr = FamilyMappingService.normalizeAddress(v.voterAddress).slice(0, 30);
        const surname = (v.engSurname || v.surname || '').trim().toLowerCase();
        const phone = (v.mobileNo || '').trim();

        if (phone && phone.length === 10) {
          clusterKey = `PHONE_${phone}`;
        } else if (normAddr && surname) {
          clusterKey = `ADDR_${normAddr}_${surname}`;
        } else {
          clusterKey = `INDIVIDUAL_${v.id}`;
        }
      }

      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      clusters.get(clusterKey)!.push(v);
    }

    // 3. Process clusters and build family entities
    const previewFamilies: any[] = [];
    const updates: Array<{
      id: string;
      familyId: string;
      isFamilyInfluencer: boolean;
      familyInfluencerId: string | null;
      familyRelation: string;
    }> = [];

    let familySeq = 1;
    let votersMapped = 0;
    let familiesCreated = 0;

    for (const [, clusterVoters] of clusters.entries()) {
      // Disambiguate if cluster is large and contains distinct surnames with no shared mobile
      let subClusters: any[][] = [clusterVoters];

      if (clusterVoters.length > 6) {
        // Check surname distribution
        const surnameMap = new Map<string, any[]>();
        for (const cv of clusterVoters) {
          const s = (cv.engSurname || cv.surname || 'OTHER').trim().toLowerCase();
          if (!surnameMap.has(s)) surnameMap.set(s, []);
          surnameMap.get(s)!.push(cv);
        }
        if (surnameMap.size > 1) {
          subClusters = Array.from(surnameMap.values());
        }
      }

      for (const group of subClusters) {
        // Elect Head of Family
        const head = FamilyMappingService.electFamilyHead(group);
        if (!head) continue;

        const cleanHouse = FamilyMappingService.normalizeHouseNo(head.houseNo) || 'NA';
        const familyCode = `FAM-B${boothNumber}-H${cleanHouse}-${String(familySeq).padStart(3, '0')}`;
        familySeq++;
        familiesCreated++;

        const memberPreviews: any[] = [];

        for (const member of group) {
          votersMapped++;
          const isHead = member.id === head.id;
          const relation = isHead ? 'Head' : FamilyMappingService.inferFamilyRelation(head, member);

          updates.push({
            id: member.id,
            familyId: familyCode,
            isFamilyInfluencer: isHead,
            familyInfluencerId: isHead ? null : head.id,
            familyRelation: relation,
          });

          memberPreviews.push({
            id: member.id,
            name: `${member.engFirstName || member.firstName || ''} ${member.engSurname || member.surname || ''}`.trim(),
            epicNo: member.epicNo,
            relation,
            gender: member.gender,
            age: member.age,
          });
        }

        previewFamilies.push({
          familyId: familyCode,
          headName: `${head.engFirstName || head.firstName || ''} ${head.engSurname || head.surname || ''}`.trim(),
          headEpicNo: head.epicNo,
          headId: head.id,
          houseNo: head.houseNo || 'N/A',
          memberCount: group.length,
          members: memberPreviews,
        });
      }
    }

    // 4. If NOT dryRun, execute batch updates transactionally (Rule 5)
    if (!dryRun && updates.length > 0) {
      const client = await dbPool.connect();
      try {
        await client.query('BEGIN');

        // Chunk updates in batches of 500
        const chunkSize = 500;
        for (let i = 0; i < updates.length; i += chunkSize) {
          const chunk = updates.slice(i, i + chunkSize);
          const caseFamilyId: string[] = [];
          const caseIsHead: string[] = [];
          const caseInfluencerId: string[] = [];
          const caseRelation: string[] = [];
          const ids: string[] = [];

          for (const item of chunk) {
            ids.push(item.id);
            caseFamilyId.push(`WHEN id = '${item.id}' THEN '${item.familyId.replace(/'/g, "''")}'`);
            caseIsHead.push(`WHEN id = '${item.id}' THEN ${item.isFamilyInfluencer ? 'TRUE' : 'FALSE'}`);
            caseInfluencerId.push(`WHEN id = '${item.id}' THEN ${item.familyInfluencerId ? `'${item.familyInfluencerId}'` : 'NULL'}`);
            caseRelation.push(`WHEN id = '${item.id}' THEN '${item.familyRelation.replace(/'/g, "''")}'`);
          }

          const inClause = ids.map((id) => `'${id}'`).join(',');
          const updateSql = `
            UPDATE voters
            SET
              family_id = CASE ${caseFamilyId.join(' ')} ELSE family_id END,
              is_family_influencer = CASE ${caseIsHead.join(' ')} ELSE is_family_influencer END,
              family_influencer_id = CASE ${caseInfluencerId.join(' ')} ELSE family_influencer_id END,
              updated_at = NOW()
            WHERE id IN (${inClause});
          `;

          await client.query(updateSql);
        }

        await client.query('COMMIT');
        logger.info(`Successfully auto-mapped ${votersMapped} voters into ${familiesCreated} families for booth ${boothId}`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        logger.error(`Failed to execute family auto-mapping transaction: ${err.message}`);
        throw err;
      } finally {
        client.release();
      }
    }

    return {
      boothId,
      totalVoters,
      familiesCreated,
      votersMapped,
      unmappedVoters: Math.max(0, totalVoters - votersMapped),
      previewFamilies: previewFamilies.slice(0, 100), // return top 100 preview entries
    };
  }

  /**
   * Get paginated list of families (Family Heads with aggregated metrics)
   */
  static async getFamiliesList(params: {
    boothId?: string;
    search?: string;
    page?: number;
    limit?: number;
    minMembers?: number;
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['v.is_family_influencer = TRUE', '(v.is_dead IS NOT TRUE)'];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.boothId) {
      conditions.push(`v.booth_id = $${paramIndex}`);
      values.push(params.boothId);
      paramIndex++;
    }

    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      conditions.push(`(
        v.family_id ILIKE $${paramIndex} OR
        v.epic_no ILIKE $${paramIndex} OR
        v.eng_first_name ILIKE $${paramIndex} OR
        v.eng_surname ILIKE $${paramIndex} OR
        v.first_name ILIKE $${paramIndex} OR
        v.surname ILIKE $${paramIndex} OR
        v.house_no ILIKE $${paramIndex} OR
        v.mobile_no ILIKE $${paramIndex}
      )`);
      values.push(s);
      paramIndex++;
    }

    if (params.minMembers && Number(params.minMembers) > 1) {
      conditions.push(`(1 + COALESCE(fic.cnt, 0)) >= $${paramIndex}`);
      values.push(Number(params.minMembers));
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total Count
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM voters v
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters fv WHERE fv.family_influencer_id = v.id AND (fv.is_dead IS NOT TRUE)
      ) fic ON true
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch Family Heads + Support Breakdown
    const dataSql = `
      SELECT 
        v.id AS "headId",
        v.family_id AS "familyId",
        v.epic_no AS "headEpicNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "headName",
        CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS "headLocalName",
        v.gender AS "headGender",
        v.age AS "headAge",
        v.mobile_no AS "headMobileNo",
        v.house_no AS "houseNo",
        v.voter_address AS "voterAddress",
        v.avatar AS "headAvatar",
        v.booth_id AS "boothId",
        b.name AS "boothName",
        b.booth_number AS "boothNumber",
        p.name AS "headPartyName",
        p.symbol_logo AS "headPartySymbol",

        -- Member counts and calculations
        (1 + COALESCE(fic.cnt, 0)) AS "totalMembers",
        COALESCE(fic.cnt, 0) AS "linkedMembersCount",

        -- Support Sentiment Breakdown
        COALESCE(sent.supporters, 0) AS "supportersCount",
        COALESCE(sent.neutral, 0) AS "neutralCount",
        COALESCE(sent.opposition, 0) AS "oppositionCount",

        -- Aggregated Influence Score
        ROUND(
          ((1 + COALESCE(fic.cnt, 0)) * 2.0) +
          (COALESCE(sent.supporters, 0) * 3.0) +
          (CASE WHEN v.is_social_influencer = TRUE THEN 10 ELSE 0 END) +
          (CASE WHEN v.mobile_no IS NOT NULL AND LENGTH(v.mobile_no) >= 10 THEN 5 ELSE 0 END),
          1
        ) AS "influenceScore"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      LEFT JOIN parties p ON v.party_id = p.id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt FROM voters fv WHERE fv.family_influencer_id = v.id AND (fv.is_dead IS NOT TRUE)
      ) fic ON true
      LEFT JOIN LATERAL (
        SELECT 
          COUNT(CASE WHEN all_fam.party_id IS NOT NULL THEN 1 END)::int AS supporters,
          COUNT(CASE WHEN all_fam.party_id IS NULL THEN 1 END)::int AS neutral,
          0::int AS opposition
        FROM voters all_fam 
        WHERE (all_fam.id = v.id OR all_fam.family_influencer_id = v.id) AND (all_fam.is_dead IS NOT TRUE)
      ) sent ON true
      ${whereClause}
      ORDER BY "influenceScore" DESC, "totalMembers" DESC, v.serial_no ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return {
      data: dataRes.rows,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get all members belonging to a family (Head + Linked Members)
   */
  static async getFamilyMembers(headId: string): Promise<{
    head: any;
    members: any[];
    summary: {
      familyId: string;
      totalMembers: number;
      supporters: number;
      neutral: number;
      opposition: number;
      influenceScore: number;
    };
  }> {
    // 1. Fetch Head
    const headSql = `
      SELECT 
        v.id,
        v.family_id AS "familyId",
        'Head' AS "familyRelation",
        v.epic_no AS "epicNo",
        v.serial_no AS "serialNo",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "engName",
        CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS "name",
        v.gender,
        v.dob,
        v.age,
        v.mobile_no AS "mobileNo",
        v.avatar,
        v.voter_address AS "voterAddress",
        v.full_address AS "fullAddress",
        v.voter_type AS "voterType",
        v.party_id AS "partyId",
        p.name AS "partyName",
        p.symbol_logo AS "partySymbol",
        v.is_family_influencer AS "isFamilyInfluencer",
        v.is_social_influencer AS "isSocialInfluencer",
        b.name AS "boothName",
        b.booth_number AS "boothNumber"
      FROM voters v
      LEFT JOIN booths b ON v.booth_id = b.id
      LEFT JOIN parties p ON v.party_id = p.id
      WHERE v.id = $1
    `;
    const headRes = await query(headSql, [headId]);
    const head = headRes.rows[0];
    if (!head) {
      throw new Error('Family Head voter not found');
    }

    // 2. Fetch all linked family members
    const membersSql = `
      SELECT 
        v.id,
        v.family_id AS "familyId",
        'Member' AS "familyRelation",
        v.epic_no AS "epicNo",
        v.serial_no AS "serialNo",
        v.section_no AS "sectionNo",
        v.house_no AS "houseNo",
        CONCAT_WS(' ', NULLIF(v.eng_first_name, ''), NULLIF(v.eng_middle_name, ''), NULLIF(v.eng_surname, '')) AS "engName",
        CONCAT_WS(' ', NULLIF(v.first_name, ''), NULLIF(v.middle_name, ''), NULLIF(v.surname, '')) AS "name",
        v.gender,
        v.dob,
        v.age,
        v.mobile_no AS "mobileNo",
        v.avatar,
        v.voter_address AS "voterAddress",
        v.voter_type AS "voterType",
        v.party_id AS "partyId",
        p.name AS "partyName",
        p.symbol_logo AS "partySymbol",
        v.is_social_influencer AS "isSocialInfluencer"
      FROM voters v
      LEFT JOIN parties p ON v.party_id = p.id
      WHERE v.family_influencer_id = $1 AND (v.is_dead IS NOT TRUE)
      ORDER BY v.age DESC
    `;
    const membersRes = await query(membersSql, [headId]);
    const members = membersRes.rows;

    const allInFamily = [head, ...members];
    const supporters = allInFamily.filter((v) => Boolean(v.partyId)).length;
    const neutral = allInFamily.filter((v) => !v.partyId).length;
    const opposition = 0;
    const totalMembers = allInFamily.length;

    const influenceScore = Number(
      (
        totalMembers * 2.0 +
        supporters * 3.0 +
        (head.isSocialInfluencer ? 10 : 0) +
        (head.mobileNo && head.mobileNo.length >= 10 ? 5 : 0)
      ).toFixed(1)
    );

    return {
      head,
      members,
      summary: {
        familyId: head.familyId || `FAM-${head.epicNo}`,
        totalMembers,
        supporters,
        neutral,
        opposition,
        influenceScore,
      },
    };
  }

  /**
   * Update the specific relationship of a family member to their Head
   */
  static async updateMemberRelation(voterId: string, relation: string): Promise<any> {
    const sql = `
      UPDATE voters
      SET updated_at = NOW()
      WHERE id = $1
      RETURNING id, family_id AS "familyId"
    `;
    const res = await query(sql, [voterId]);
    return { ...res.rows[0], familyRelation: relation };
  }

  /**
   * Transfer Head of Family role to another family member
   */
  static async setNewFamilyHead(currentHeadId: string, newHeadId: string): Promise<void> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get family_id of current head
      const headCheck = await client.query(`SELECT family_id FROM voters WHERE id = $1`, [currentHeadId]);
      const familyId = headCheck.rows[0]?.family_id || null;

      // 2. Demote current head to Member
      await client.query(
        `UPDATE voters 
         SET is_family_influencer = FALSE, 
             family_influencer_id = $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [newHeadId, currentHeadId]
      );

      // 3. Promote new head
      await client.query(
        `UPDATE voters 
         SET is_family_influencer = TRUE, 
             family_influencer_id = NULL, 
             family_id = $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [familyId, newHeadId]
      );

      // 4. Re-point other existing members to new head
      await client.query(
        `UPDATE voters 
         SET family_influencer_id = $1, updated_at = NOW() 
         WHERE family_influencer_id = $2 AND id != $1`,
        [newHeadId, currentHeadId]
      );

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
