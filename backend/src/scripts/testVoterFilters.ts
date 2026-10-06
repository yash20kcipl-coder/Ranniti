import { VoterQueries } from '../queries/voter.queries';
import { dbPool, query, closeDbPool } from '../queries/dbPool';
import { TenantPoolManager } from '../utils/tenantPoolManager';
import { VoterFilterParams } from '../models/voter.model';
import * as fs from 'fs';
import * as path from 'path';

export interface TestFailureDetail {
  testId: number;
  filterName: string;
  params: VoterFilterParams;
  issueCategory: 'DATA_COMING_WRONG' | 'DATA_NOT_COMING' | 'MISSING_KEY' | 'SNAKE_CASE_LEAK' | 'TYPE_MISMATCH' | 'RELATION_NAME_MISSING' | 'EXCEPTION';
  description: string;
  expected?: any;
  actual?: any;
  problematicRecord?: any;
}

export interface TestSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  dataComingWrongCount: number;
  dataNotComingCount: number;
  missingKeyCount: number;
  snakeCaseLeakCount: number;
  typeMismatchCount: number;
  relationNameMissingCount: number;
  exceptionCount: number;
  failures: TestFailureDetail[];
}

const EXPECTED_CAMELCASE_KEYS = [
  'id',
  'epicNo',
  'stateId',
  'stateName',
  'districtId',
  'districtName',
  'pcId',
  'pcName',
  'acId',
  'acName',
  'boothId',
  'boothName',
  'boothNumber',
  'serialNo',
  'sectionNo',
  'houseNo',
  'firstName',
  'engFirstName',
  'middleName',
  'engMiddleName',
  'surname',
  'engSurname',
  'gender',
  'dob',
  'age',
  'mobileNo',
  'email',
  'aadhaarNo',
  'panNo',
  'professionType',
  'profession',
  'religionId',
  'religionName',
  'casteId',
  'casteName',
  'subcasteName',
  'voterType',
  'status',
  'isDead',
  'bloodGroup',
  'avatar',
  'taluka',
  'village',
  'fullAddress',
  'voterAddress',
  'partyId',
  'partyName',
  'partyAbbreviation',
  'partySymbol',
  'familyInfluencerId',
  'familyInfluencerName',
  'familyInfluencerEpic',
  'familyInfluencedCount',
  'isFamilyInfluencer',
  'socialInfluencerId',
  'socialInfluencerName',
  'socialInfluencerEpic',
  'socialInfluencedCount',
  'isSocialInfluencer',
  'familyId',
  'createdAt',
  'updatedAt'
];

const KNOWN_SNAKE_CASE_KEYS = [
  'epic_no', 'state_id', 'district_id', 'pc_id', 'ac_id', 'booth_id', 'serial_no',
  'section_no', 'house_no', 'first_name', 'eng_first_name', 'middle_name', 'eng_middle_name',
  'eng_surname', 'mobile_no', 'aadhaar_no', 'pan_no', 'profession_type',
  'religion_id', 'caste_id', 'subcaste_name', 'voter_type', 'is_dead', 'blood_group',
  'full_address', 'voter_address', 'party_id', 'family_influencer_id', 'social_influencer_id',
  'is_family_influencer', 'is_social_influencer', 'family_id', 'created_at', 'updated_at'
];

async function runVoterFilterTests() {
  console.log('🚀 Starting Comprehensive Voter List API Filter Testing (1000+ Test Suite)...\n');

  const summary: TestSummary = {
    totalTests: 0,
    passedCount: 0,
    failedCount: 0,
    dataComingWrongCount: 0,
    dataNotComingCount: 0,
    missingKeyCount: 0,
    snakeCaseLeakCount: 0,
    typeMismatchCount: 0,
    relationNameMissingCount: 0,
    exceptionCount: 0,
    failures: [],
  };

  // Step 1: Extract real sample values from Database
  console.log('🔍 Fetching real seed voter data from Master Database...');

  const masterDbSampleQuery = `
    SELECT 
      v.id, v.epic_no, v.gender, v.voter_type, v.status, v.is_dead, v.age,
      v.state_id, v.district_id, v.pc_id, v.ac_id, v.booth_id,
      v.religion_id, v.caste_id, v.party_id,
      v.family_influencer_id, v.social_influencer_id,
      v.eng_first_name, v.eng_surname, v.mobile_no, v.house_no
    FROM voters v
    LIMIT 2000
  `;

  const sampleRes = await query(masterDbSampleQuery);
  const sampleRows = sampleRes.rows;

  if (!sampleRows || sampleRows.length === 0) {
    console.error('❌ Error: No voters found in database to run tests against.');
    await closeDbPool();
    process.exit(1);
  }

  console.log(`✅ Loaded ${sampleRows.length} voters for sampling real filter parameters.\n`);

  // Distinct values for filter generation
  const distinctStates = Array.from(new Set(sampleRows.map(r => r.state_id).filter(Boolean)));
  const distinctDistricts = Array.from(new Set(sampleRows.map(r => r.district_id).filter(Boolean)));
  const distinctPcs = Array.from(new Set(sampleRows.map(r => r.pc_id).filter(Boolean)));
  const distinctAcs = Array.from(new Set(sampleRows.map(r => r.ac_id).filter(Boolean)));
  const distinctBooths = Array.from(new Set(sampleRows.map(r => r.booth_id).filter(Boolean)));
  const distinctGenders = Array.from(new Set(sampleRows.map(r => r.gender).filter(Boolean)));
  const distinctVoterTypes = Array.from(new Set(sampleRows.map(r => r.voter_type).filter(Boolean)));
  const distinctStatuses = Array.from(new Set(sampleRows.map(r => r.status).filter(Boolean)));
  const distinctReligions = Array.from(new Set(sampleRows.map(r => r.religion_id).filter(Boolean)));
  const distinctCastes = Array.from(new Set(sampleRows.map(r => r.caste_id).filter(Boolean)));
  const distinctParties = Array.from(new Set(sampleRows.map(r => r.party_id).filter(Boolean)));
  const distinctFamilyInfluencers = Array.from(new Set(sampleRows.map(r => r.family_influencer_id).filter(Boolean)));
  const distinctSocialInfluencers = Array.from(new Set(sampleRows.map(r => r.social_influencer_id).filter(Boolean)));

  const sampleSearchTerms = Array.from(new Set([
    ...sampleRows.slice(0, 30).map(r => r.epic_no).filter(Boolean),
    ...sampleRows.slice(0, 30).map(r => r.eng_first_name).filter(Boolean),
    ...sampleRows.slice(0, 30).map(r => r.eng_surname).filter(Boolean),
    ...sampleRows.slice(0, 20).map(r => r.mobile_no).filter(Boolean),
    ...sampleRows.slice(0, 20).map(r => r.house_no).filter(Boolean),
  ]));

  const ageGroups = ['18-25', '26-35', '36-45', '46-60', '60-100'];

  // Step 2: Build 1000+ Test Scenarios
  const testCases: Array<{ filterName: string; params: VoterFilterParams; tenantDbName?: string }> = [];

  // A. Single Filter Tests (600+ test cases)
  // 1. Search filter
  for (const term of sampleSearchTerms) {
    testCases.push({ filterName: 'search', params: { search: term } });
  }

  // 2. acId filter
  for (const acId of distinctAcs) {
    testCases.push({ filterName: 'acId', params: { acId } });
  }

  // 3. boothId filter
  for (const boothId of distinctBooths.slice(0, 100)) {
    testCases.push({ filterName: 'boothId', params: { boothId } });
  }

  // 4. pcId filter
  for (const pcId of distinctPcs) {
    testCases.push({ filterName: 'pcId', params: { pcId } });
  }

  // 5. districtId filter
  for (const districtId of distinctDistricts) {
    testCases.push({ filterName: 'districtId', params: { districtId } });
  }

  // 6. stateId filter
  for (const stateId of distinctStates) {
    testCases.push({ filterName: 'stateId', params: { stateId } });
  }

  // 7. gender filter
  for (const gender of distinctGenders) {
    testCases.push({ filterName: 'gender', params: { gender } });
    testCases.push({ filterName: 'gender (lowercase)', params: { gender: gender.toLowerCase() } });
    testCases.push({ filterName: 'gender (uppercase)', params: { gender: gender.toUpperCase() } });
  }

  // 8. voterType filter
  for (const voterType of distinctVoterTypes) {
    testCases.push({ filterName: 'voterType', params: { voterType } });
  }

  // 9. status filter
  for (const status of distinctStatuses) {
    testCases.push({ filterName: 'status', params: { status } });
  }

  // 10. isDead filter
  testCases.push({ filterName: 'isDead (true)', params: { isDead: true } });
  testCases.push({ filterName: 'isDead (false)', params: { isDead: false } });
  testCases.push({ filterName: 'isDead (string "true")', params: { isDead: 'true' as any } });
  testCases.push({ filterName: 'isDead (string "false")', params: { isDead: 'false' as any } });

  // 11. religionId filter
  for (const religionId of distinctReligions) {
    testCases.push({ filterName: 'religionId', params: { religionId } });
  }

  // 12. casteId filter
  for (const casteId of distinctCastes) {
    testCases.push({ filterName: 'casteId', params: { casteId } });
  }

  // 13. partyId filter
  for (const partyId of distinctParties) {
    testCases.push({ filterName: 'partyId', params: { partyId } });
  }

  // 14. ageGroup filter
  for (const group of ageGroups) {
    testCases.push({ filterName: 'ageGroup', params: { ageGroup: group } });
  }

  // 15. familyInfluencerId filter
  for (const fiId of distinctFamilyInfluencers.slice(0, 30)) {
    testCases.push({ filterName: 'familyInfluencerId', params: { familyInfluencerId: fiId } });
  }

  // 16. socialInfluencerId filter
  for (const siId of distinctSocialInfluencers.slice(0, 30)) {
    testCases.push({ filterName: 'socialInfluencerId', params: { socialInfluencerId: siId } });
  }

  // 17. influencerStatus & influencerRole
  testCases.push({ filterName: 'influencerStatus (assigned)', params: { influencerStatus: 'assigned' } });
  testCases.push({ filterName: 'influencerStatus (unassigned)', params: { influencerStatus: 'unassigned' } });
  testCases.push({ filterName: 'influencerRole (family)', params: { influencerRole: 'family' } });
  testCases.push({ filterName: 'influencerRole (social)', params: { influencerRole: 'social' } });
  testCases.push({ filterName: 'influencerRole (any)', params: { influencerRole: 'any' } });
  testCases.push({ filterName: 'isFamilyInfluencer (true)', params: { isFamilyInfluencer: true } });
  testCases.push({ filterName: 'isSocialInfluencer (true)', params: { isSocialInfluencer: true } });

  // B. Multi-Filter Combinations (400+ test cases)
  const acList = distinctAcs.length > 0 ? distinctAcs : [''];
  const boothList = distinctBooths.length > 0 ? distinctBooths : [''];
  const genderList = distinctGenders.length > 0 ? distinctGenders : ['Male', 'Female'];
  const casteList = distinctCastes.length > 0 ? distinctCastes : [''];
  const religionList = distinctReligions.length > 0 ? distinctReligions : [''];
  const partyList = distinctParties.length > 0 ? distinctParties : [''];

  for (const acId of acList.slice(0, 5)) {
    for (const boothId of boothList.slice(0, 10)) {
      for (const gender of genderList.slice(0, 2)) {
        testCases.push({
          filterName: 'Combined (acId + boothId + gender)',
          params: { acId, boothId, gender }
        });
      }
    }
  }

  for (const acId of acList.slice(0, 5)) {
    for (const casteId of casteList.slice(0, 5)) {
      for (const ageGroup of ageGroups) {
        testCases.push({
          filterName: 'Combined (acId + casteId + ageGroup)',
          params: { acId, casteId, ageGroup }
        });
      }
    }
  }

  for (const religionId of religionList.slice(0, 5)) {
    for (const partyId of partyList.slice(0, 5)) {
      for (const status of distinctStatuses.slice(0, 2)) {
        testCases.push({
          filterName: 'Combined (religionId + partyId + status)',
          params: { religionId, partyId, status }
        });
      }
    }
  }

  for (const acId of acList.slice(0, 5)) {
    for (const infStatus of ['assigned', 'unassigned']) {
      for (const gender of genderList.slice(0, 2)) {
        testCases.push({
          filterName: 'Combined (acId + influencerStatus + gender)',
          params: { acId, influencerStatus: infStatus, gender }
        });
      }
    }
  }

  // C. Tenant Database Specific Filter Tests
  const tenantDbs = ['ranniti_tenant_admin_5667'];
  for (const tenantDbName of tenantDbs) {
    for (const gender of genderList) {
      testCases.push({
        filterName: `Tenant (${tenantDbName}) gender`,
        params: { gender, tenantDbName }
      });
    }
    for (const acId of acList.slice(0, 3)) {
      testCases.push({
        filterName: `Tenant (${tenantDbName}) acId`,
        params: { acId, tenantDbName }
      });
    }
  }

  // Ensure total test cases count >= 1000
  while (testCases.length < 1000) {
    const randomAc = acList[Math.floor(Math.random() * acList.length)];
    const randomGender = genderList[Math.floor(Math.random() * genderList.length)];
    const randomCaste = casteList[Math.floor(Math.random() * casteList.length)];
    const randomAge = ageGroups[Math.floor(Math.random() * ageGroups.length)];
    const randomPage = Math.floor(Math.random() * 5) + 1;

    testCases.push({
      filterName: `Random Combined Test #${testCases.length + 1}`,
      params: { acId: randomAc, gender: randomGender, casteId: randomCaste, ageGroup: randomAge, page: randomPage, limit: 10 }
    });
  }

  console.log(`📊 Generated ${testCases.length} filter test scenarios for execution.\n`);

  // Helper SQL query builder for ground-truth validation
  function buildRawCountSql(params: VoterFilterParams): { countSql: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      conditions.push(
        `(v.epic_no ILIKE $${idx} OR v.eng_first_name ILIKE $${idx} OR v.eng_surname ILIKE $${idx} OR v.first_name ILIKE $${idx} OR v.surname ILIKE $${idx} OR v.mobile_no ILIKE $${idx} OR v.house_no ILIKE $${idx})`
      );
      values.push(searchPattern);
      idx++;
    }

    if (params.boothId) {
      conditions.push(`v.booth_id = $${idx}`);
      values.push(params.boothId);
      idx++;
    }

    if (params.acId) {
      conditions.push(`v.ac_id = $${idx}`);
      values.push(params.acId);
      idx++;
    } else if (params.acIds && params.acIds.length > 0) {
      conditions.push(`v.ac_id = ANY($${idx}::uuid[])`);
      values.push(params.acIds);
      idx++;
    }

    if (params.pcId) {
      conditions.push(`v.pc_id = $${idx}`);
      values.push(params.pcId);
      idx++;
    }

    if (params.gender) {
      conditions.push(`LOWER(v.gender) = LOWER($${idx})`);
      values.push(params.gender);
      idx++;
    }

    if (params.voterType) {
      conditions.push(`v.voter_type = $${idx}`);
      values.push(params.voterType);
      idx++;
    }

    if (params.status) {
      conditions.push(`v.status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    if (params.isDead !== undefined && params.isDead !== '') {
      const isDeadBool = params.isDead === true || params.isDead === 'true';
      conditions.push(`v.is_dead = $${idx}`);
      values.push(isDeadBool);
      idx++;
    }

    if (params.religionId) {
      conditions.push(`v.religion_id = $${idx}`);
      values.push(params.religionId);
      idx++;
    }

    if (params.casteId) {
      conditions.push(`v.caste_id = $${idx}`);
      values.push(params.casteId);
      idx++;
    }

    if (params.stateId) {
      conditions.push(`v.state_id = $${idx}`);
      values.push(params.stateId);
      idx++;
    }

    if (params.districtId) {
      conditions.push(`v.district_id = $${idx}`);
      values.push(params.districtId);
      idx++;
    }

    if (params.partyId) {
      conditions.push(`v.party_id = $${idx}`);
      values.push(params.partyId);
      idx++;
    }

    if (params.ageGroup && params.ageGroup.includes('-')) {
      const [minStr, maxStr] = params.ageGroup.split('-');
      const minAge = parseInt(minStr, 10);
      const maxAge = parseInt(maxStr, 10);
      if (!isNaN(minAge) && !isNaN(maxAge)) {
        conditions.push(`v.age >= $${idx} AND v.age <= $${idx + 1}`);
        values.push(minAge, maxAge);
        idx += 2;
      }
    }

    if (params.familyInfluencerId) {
      conditions.push(`v.family_influencer_id = $${idx}`);
      values.push(params.familyInfluencerId);
      idx++;
    }

    if (params.socialInfluencerId) {
      conditions.push(`v.social_influencer_id = $${idx}`);
      values.push(params.socialInfluencerId);
      idx++;
    }

    if (params.influencerRole === 'family') {
      conditions.push(`(v.is_family_influencer = TRUE OR v.family_influencer_id IS NOT NULL)`);
    } else if (params.influencerRole === 'social') {
      conditions.push(`(v.is_social_influencer = TRUE OR v.social_influencer_id IS NOT NULL)`);
    } else if (params.influencerRole === 'any') {
      conditions.push(`(v.is_family_influencer = TRUE OR v.is_social_influencer = TRUE OR v.family_influencer_id IS NOT NULL OR v.social_influencer_id IS NOT NULL)`);
    } else {
      if (params.isFamilyInfluencer !== undefined && params.isFamilyInfluencer !== '') {
        const isFam = params.isFamilyInfluencer === true || params.isFamilyInfluencer === 'true';
        if (isFam) {
          conditions.push(`(v.is_family_influencer = TRUE OR v.family_influencer_id IS NOT NULL)`);
        }
      }

      if (params.isSocialInfluencer !== undefined && params.isSocialInfluencer !== '') {
        const isSoc = params.isSocialInfluencer === true || params.isSocialInfluencer === 'true';
        if (isSoc) {
          conditions.push(`(v.is_social_influencer = TRUE OR v.social_influencer_id IS NOT NULL)`);
        }
      }
    }

    if (params.influencerStatus === 'assigned') {
      conditions.push(`(v.family_influencer_id IS NOT NULL OR v.social_influencer_id IS NOT NULL)`);
    } else if (params.influencerStatus === 'unassigned') {
      conditions.push(`(v.family_influencer_id IS NULL AND v.social_influencer_id IS NULL)`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return {
      countSql: `SELECT COUNT(*)::int AS total FROM voters v ${whereClause}`,
      values
    };
  }

  // Step 3: Run the tests!
  console.log('⚡ Running test assertions...');
  let currentTestIndex = 0;

  for (const tc of testCases) {
    currentTestIndex++;
    summary.totalTests++;

    if (currentTestIndex % 100 === 0 || currentTestIndex === testCases.length) {
      process.stdout.write(` Progress: ${currentTestIndex}/${testCases.length} tests completed...\r`);
    }

    try {
      // Execute the query under test
      const apiResult = await VoterQueries.getVoters({ ...tc.params, page: tc.params.page || 1, limit: tc.params.limit || 25 });

      // Ground truth query execution
      const { countSql, values } = buildRawCountSql(tc.params);
      let dbCount = 0;

      const targetTenantDb = tc.tenantDbName || tc.params.tenantDbName;
      if (targetTenantDb) {
        const res = await TenantPoolManager.query(targetTenantDb, countSql, values);
        dbCount = res.rows[0]?.total || 0;
      } else {
        const res = await query(countSql, values);
        dbCount = res.rows[0]?.total || 0;
      }

      let hasTestFailure = false;

      // 1. DATA_NOT_COMING Check: Total count mismatch
      if (apiResult.total !== dbCount) {
        hasTestFailure = true;
        summary.dataNotComingCount++;
        summary.failures.push({
          testId: currentTestIndex,
          filterName: tc.filterName,
          params: tc.params,
          issueCategory: 'DATA_NOT_COMING',
          description: `Total count mismatch. API returned total=${apiResult.total}, but raw DB count=${dbCount}. Valid records are missing or filtered out unexpectedly.`,
          expected: dbCount,
          actual: apiResult.total
        });
      }

      // 2. Check each returned record for integrity & filter correctness
      for (const record of apiResult.data) {
        const recordKeys = Object.keys(record);

        // a. MISSING_KEY Check
        for (const reqKey of EXPECTED_CAMELCASE_KEYS) {
          if (!(reqKey in record)) {
            hasTestFailure = true;
            summary.missingKeyCount++;
            summary.failures.push({
              testId: currentTestIndex,
              filterName: tc.filterName,
              params: tc.params,
              issueCategory: 'MISSING_KEY',
              description: `Missing required property key '${reqKey}' in returned voter object.`,
              expected: `Property '${reqKey}' to be present`,
              actual: `Key '${reqKey}' is undefined/missing`,
              problematicRecord: { voterId: record.id, epicNo: record.epicNo }
            });
            break;
          }
        }

        // b. SNAKE_CASE_LEAK Check
        for (const snakeKey of KNOWN_SNAKE_CASE_KEYS) {
          if (snakeKey in record) {
            hasTestFailure = true;
            summary.snakeCaseLeakCount++;
            summary.failures.push({
              testId: currentTestIndex,
              filterName: tc.filterName,
              params: tc.params,
              issueCategory: 'SNAKE_CASE_LEAK',
              description: `Raw database snake_case property '${snakeKey}' leaked into response object without camelCase mapping.`,
              expected: `Only camelCase keys present`,
              actual: `Found raw DB key '${snakeKey}' in object`,
              problematicRecord: { voterId: record.id, epicNo: record.epicNo }
            });
            break;
          }
        }

        // c. TYPE_MISMATCH Check
        if (typeof record.isDead !== 'boolean') {
          hasTestFailure = true;
          summary.typeMismatchCount++;
          summary.failures.push({
            testId: currentTestIndex,
            filterName: tc.filterName,
            params: tc.params,
            issueCategory: 'TYPE_MISMATCH',
            description: `Property 'isDead' must be boolean, but received type '${typeof record.isDead}' with value '${record.isDead}'.`,
            expected: 'boolean',
            actual: typeof record.isDead,
            problematicRecord: { voterId: record.id, epicNo: record.epicNo }
          });
        }

        if (typeof record.isFamilyInfluencer !== 'boolean') {
          hasTestFailure = true;
          summary.typeMismatchCount++;
          summary.failures.push({
            testId: currentTestIndex,
            filterName: tc.filterName,
            params: tc.params,
            issueCategory: 'TYPE_MISMATCH',
            description: `Property 'isFamilyInfluencer' must be boolean, but received type '${typeof record.isFamilyInfluencer}'.`,
            expected: 'boolean',
            actual: typeof record.isFamilyInfluencer,
            problematicRecord: { voterId: record.id, epicNo: record.epicNo }
          });
        }

        // d. DATA_COMING_WRONG Filter Correctness Checks
        if (tc.params.gender && record.gender && record.gender.toLowerCase() !== tc.params.gender.toLowerCase()) {
          hasTestFailure = true;
          summary.dataComingWrongCount++;
          summary.failures.push({
            testId: currentTestIndex,
            filterName: tc.filterName,
            params: tc.params,
            issueCategory: 'DATA_COMING_WRONG',
            description: `Requested filter gender='${tc.params.gender}', but record returned gender='${record.gender}'.`,
            expected: tc.params.gender,
            actual: record.gender,
            problematicRecord: { voterId: record.id, epicNo: record.epicNo }
          });
        }

        if (tc.params.acId && record.acId && record.acId !== tc.params.acId) {
          hasTestFailure = true;
          summary.dataComingWrongCount++;
          summary.failures.push({
            testId: currentTestIndex,
            filterName: tc.filterName,
            params: tc.params,
            issueCategory: 'DATA_COMING_WRONG',
            description: `Requested filter acId='${tc.params.acId}', but record returned acId='${record.acId}'.`,
            expected: tc.params.acId,
            actual: record.acId,
            problematicRecord: { voterId: record.id, epicNo: record.epicNo }
          });
        }

        if (tc.params.boothId && record.boothId && record.boothId !== tc.params.boothId) {
          hasTestFailure = true;
          summary.dataComingWrongCount++;
          summary.failures.push({
            testId: currentTestIndex,
            filterName: tc.filterName,
            params: tc.params,
            issueCategory: 'DATA_COMING_WRONG',
            description: `Requested filter boothId='${tc.params.boothId}', but record returned boothId='${record.boothId}'.`,
            expected: tc.params.boothId,
            actual: record.boothId,
            problematicRecord: { voterId: record.id, epicNo: record.epicNo }
          });
        }

        if (tc.params.isDead !== undefined && tc.params.isDead !== '') {
          const expectedBool = tc.params.isDead === true || tc.params.isDead === 'true';
          if (record.isDead !== expectedBool) {
            hasTestFailure = true;
            summary.dataComingWrongCount++;
            summary.failures.push({
              testId: currentTestIndex,
              filterName: tc.filterName,
              params: tc.params,
              issueCategory: 'DATA_COMING_WRONG',
              description: `Requested filter isDead='${tc.params.isDead}', but record returned isDead='${record.isDead}'.`,
              expected: expectedBool,
              actual: record.isDead,
              problematicRecord: { voterId: record.id, epicNo: record.epicNo }
            });
          }
        }

        if (tc.params.ageGroup && tc.params.ageGroup.includes('-')) {
          const [minStr, maxStr] = tc.params.ageGroup.split('-');
          const minAge = parseInt(minStr, 10);
          const maxAge = parseInt(maxStr, 10);
          if (record.age !== null && record.age !== undefined) {
            if (record.age < minAge || record.age > maxAge) {
              hasTestFailure = true;
              summary.dataComingWrongCount++;
              summary.failures.push({
                testId: currentTestIndex,
                filterName: tc.filterName,
                params: tc.params,
                issueCategory: 'DATA_COMING_WRONG',
                description: `Requested ageGroup='${tc.params.ageGroup}' (${minAge}-${maxAge}), but record returned age=${record.age}.`,
                expected: `${minAge}-${maxAge}`,
                actual: record.age,
                problematicRecord: { voterId: record.id, epicNo: record.epicNo }
              });
            }
          }
        }

        if (tc.params.influencerStatus === 'assigned') {
          if (!record.familyInfluencerId && !record.socialInfluencerId) {
            hasTestFailure = true;
            summary.dataComingWrongCount++;
            summary.failures.push({
              testId: currentTestIndex,
              filterName: tc.filterName,
              params: tc.params,
              issueCategory: 'DATA_COMING_WRONG',
              description: `Requested influencerStatus='assigned', but record returned with both familyInfluencerId and socialInfluencerId as null/empty.`,
              expected: 'At least one influencer ID set',
              actual: 'Both family and social influencer IDs are null',
              problematicRecord: { voterId: record.id, epicNo: record.epicNo }
            });
          }
        } else if (tc.params.influencerStatus === 'unassigned') {
          if (record.familyInfluencerId || record.socialInfluencerId) {
            hasTestFailure = true;
            summary.dataComingWrongCount++;
            summary.failures.push({
              testId: currentTestIndex,
              filterName: tc.filterName,
              params: tc.params,
              issueCategory: 'DATA_COMING_WRONG',
              description: `Requested influencerStatus='unassigned', but record has assigned influencer (family: '${record.familyInfluencerId}', social: '${record.socialInfluencerId}').`,
              expected: 'Both influencer IDs null',
              actual: 'Has assigned influencer',
              problematicRecord: { voterId: record.id, epicNo: record.epicNo }
            });
          }
        }

        // e. RELATION_NAME_MISSING Check: Check if foreign key names are missing when reference ID exists
        if (record.acId && record.acName === null) {
          hasTestFailure = true;
          summary.relationNameMissingCount++;
          summary.failures.push({
            testId: currentTestIndex,
            filterName: tc.filterName,
            params: tc.params,
            issueCategory: 'RELATION_NAME_MISSING',
            description: `Record has acId='${record.acId}' but acName is null. Foreign key JOIN in database query failed or missing reference.`,
            expected: 'Populated acName',
            actual: 'null',
            problematicRecord: { voterId: record.id, epicNo: record.epicNo }
          });
        }

        if (record.boothId && record.boothName === null) {
          hasTestFailure = true;
          summary.relationNameMissingCount++;
          summary.failures.push({
            testId: currentTestIndex,
            filterName: tc.filterName,
            params: tc.params,
            issueCategory: 'RELATION_NAME_MISSING',
            description: `Record has boothId='${record.boothId}' but boothName is null. Foreign key JOIN in database query failed or missing reference.`,
            expected: 'Populated boothName',
            actual: 'null',
            problematicRecord: { voterId: record.id, epicNo: record.epicNo }
          });
        }
      }

      if (hasTestFailure) {
        summary.failedCount++;
      } else {
        summary.passedCount++;
      }

    } catch (err: any) {
      summary.failedCount++;
      summary.exceptionCount++;
      summary.failures.push({
        testId: currentTestIndex,
        filterName: tc.filterName,
        params: tc.params,
        issueCategory: 'EXCEPTION',
        description: `API / Query threw unexpected exception: ${err.message}`,
        expected: 'Successful query execution',
        actual: err.message
      });
    }
  }

  console.log('\n\n================================================================================');
  console.log('                 VOTER LIST API FILTER TEST RESULTS SUMMARY                      ');
  console.log('================================================================================');
  console.log(`  Total Tests Executed        : ${summary.totalTests}`);
  console.log(`  Passed Tests                : ${summary.passedCount} (${((summary.passedCount / summary.totalTests) * 100).toFixed(2)}%)`);
  console.log(`  Failed Tests                : ${summary.failedCount} (${((summary.failedCount / summary.totalTests) * 100).toFixed(2)}%)`);
  console.log('--------------------------------------------------------------------------------');
  console.log('  BREAKDOWN OF ISSUES DETECTED:');
  console.log(`  - Data Coming Wrong         : ${summary.dataComingWrongCount}`);
  console.log(`  - Data Not Coming (Mismatch): ${summary.dataNotComingCount}`);
  console.log(`  - Missing Keys              : ${summary.missingKeyCount}`);
  console.log(`  - Snake Case Leaks          : ${summary.snakeCaseLeakCount}`);
  console.log(`  - Type Mismatches           : ${summary.typeMismatchCount}`);
  console.log(`  - Missing Relation Names    : ${summary.relationNameMissingCount}`);
  console.log(`  - Runtime Exceptions        : ${summary.exceptionCount}`);
  console.log('================================================================================\n');

  if (summary.failures.length > 0) {
    console.log('🔴 SAMPLE FAILURE DETAILS (First 15 Failures):');
    summary.failures.slice(0, 15).forEach((f, idx) => {
      console.log(`\n  [#${idx + 1}] Test #${f.testId} - Category: ${f.issueCategory} (${f.filterName})`);
      console.log(`      Params      : ${JSON.stringify(f.params)}`);
      console.log(`      Description : ${f.description}`);
      if (f.expected !== undefined) console.log(`      Expected    : ${JSON.stringify(f.expected)}`);
      if (f.actual !== undefined) console.log(`      Actual      : ${JSON.stringify(f.actual)}`);
      if (f.problematicRecord) console.log(`      Voter Info  : ${JSON.stringify(f.problematicRecord)}`);
    });
  } else {
    console.log('🎉 ALL 1000+ VOTER LIST API FILTER TESTS PASSED PERFECTLY WITH 100% ACCURACY!');
  }

  // Save report artifact
  const docsDir = path.join(__dirname, '../../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const reportPath = path.join(docsDir, 'voter_filter_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`\n📁 Full JSON Test Report saved to: ${reportPath}`);

  await closeDbPool();
}

runVoterFilterTests().catch(async (err) => {
  console.error('Fatal error running voter filter test runner:', err);
  await closeDbPool();
  process.exit(1);
});
