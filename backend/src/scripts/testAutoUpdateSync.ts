import { query as masterQuery, closeDbPool } from '../queries/dbPool';
import { getTenantDbPool } from '../utils/tenantDbProvisioner';
import { MasterAutoSyncService } from '../services/sync/masterAutoSync.service';
import { SyncOutboxRetryService } from '../services/sync/syncOutboxRetry.service';
import { TransactionalOutbox } from '../utils/transactionalOutbox';
import { TenantSyncService } from '../services/superAdmin/tenantSync.service';
import { logger } from '../utils/logger';

interface TestResult {
  step: string;
  description: string;
  passed: boolean;
  details?: any;
  error?: string;
}

async function runAutoUpdateSyncTest() {
  const results: TestResult[] = [];
  logger.info('================================================================');
  logger.info('🚀 STARTING TENANT <-> MASTER DB AUTOUPDATE & SYNC TEST SUITE');
  logger.info('================================================================');

  let tenantPool: any = null;
  const testEpicPrefix = `TS_${Date.now().toString().slice(-6)}`;
  let tenantId = '';
  let tenantDbName = '';

  try {
    // -------------------------------------------------------------
    // Step 0: Identify active tenant and verify DB connections
    // -------------------------------------------------------------
    const tenantRes = await masterQuery(
      `SELECT id, name, tenant_db_name, status, ac_ids, pc_ids FROM tenants WHERE status = 'active' LIMIT 1`
    );
    if (!tenantRes.rows || tenantRes.rows.length === 0) {
      throw new Error('No active tenant found in master database.');
    }
    const tenant = tenantRes.rows[0];
    tenantId = tenant.id;
    tenantDbName = tenant.tenant_db_name;
    tenantPool = getTenantDbPool(tenantDbName);

    logger.info(`Target Tenant: ${tenant.name} (${tenantId}) | DB: ${tenantDbName}`);

    // Pre-test purge of any leftover test records from prior runs
    await tenantPool.query(`DELETE FROM voters WHERE epic_no LIKE 'TEST_AUTOSYNC%' OR epic_no LIKE 'TS_%'`);
    await masterQuery(`DELETE FROM voters WHERE epic_no LIKE 'TEST_AUTOSYNC%' OR epic_no LIKE 'TS_%'`);
    await tenantPool.query(`DELETE FROM tenant_sync_outbox WHERE entity_type = 'voter' AND (payload->>'epicNo' LIKE 'TEST_AUTOSYNC%' OR payload->>'epicNo' LIKE 'TS_%' OR error_message LIKE '%Simulated%')`);

    // Pre-flight sync status check
    const preSyncStatus = await TenantSyncService.checkDbSyncStatus(tenantId);
    results.push({
      step: 'Step 0: Baseline Sync Health Audit',
      description: 'Audit baseline sync health between Master DB and Tenant DB',
      passed: preSyncStatus.isReachable && preSyncStatus.isSchemaSynced,
      details: {
        syncStatus: preSyncStatus.syncStatus,
        voterCountMaster: preSyncStatus.voterCountMaster,
        voterCountTenant: preSyncStatus.voterCountTenant,
        isSchemaSynced: preSyncStatus.isSchemaSynced,
        missingTables: preSyncStatus.missingTables,
      },
    });

    // Obtain reference IDs from existing tenant DB for valid foreign keys
    const refData = await tenantPool.query(
      `SELECT state_id, district_id, pc_id, ac_id, booth_id FROM voters WHERE booth_id IS NOT NULL LIMIT 1`
    );
    const { state_id, district_id, pc_id, ac_id, booth_id } = refData.rows[0] || {};

    // -------------------------------------------------------------
    // Step 1: Forward Auto-Update: Tenant Voter CREATE -> Master DB
    // -------------------------------------------------------------
    const voter1Epic = `${testEpicPrefix}_V1`;
    const voter1Id = 'a1111111-1111-4111-8111-111111111111';
    const voter1Payload = {
      id: voter1Id,
      epicNo: voter1Epic,
      firstName: 'AutoSync',
      middleName: 'Tenant',
      surname: 'Tester',
      engFirstName: 'AutoSync',
      engMiddleName: 'Tenant',
      engSurname: 'Tester',
      gender: 'MALE',
      age: 29,
      mobileNo: '9876543210',
      stateId: state_id,
      districtId: district_id,
      pcId: pc_id,
      acId: ac_id,
      boothId: booth_id,
      status: 'ACTIVE',
      updatedAt: new Date(),
    };

    // Insert into Tenant DB
    await tenantPool.query(
      `INSERT INTO voters (id, epic_no, first_name, middle_name, surname, eng_first_name, eng_middle_name, eng_surname, gender, age, mobile_no, state_id, district_id, pc_id, ac_id, booth_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), $18)`,
      [
        voter1Payload.id,
        voter1Payload.epicNo,
        voter1Payload.firstName,
        voter1Payload.middleName,
        voter1Payload.surname,
        voter1Payload.engFirstName,
        voter1Payload.engMiddleName,
        voter1Payload.engSurname,
        voter1Payload.gender,
        voter1Payload.age,
        voter1Payload.mobileNo,
        voter1Payload.stateId,
        voter1Payload.districtId,
        voter1Payload.pcId,
        voter1Payload.acId,
        voter1Payload.boothId,
        voter1Payload.status,
        voter1Payload.updatedAt,
      ]
    );

    // Trigger auto-sync to Master DB
    const syncCreateRes = await MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'voter',
      voter1Id,
      'CREATE',
      voter1Payload,
      false,
      'tenant'
    );

    // Verify presence in Master DB
    const masterVoter1 = await masterQuery(`SELECT id, epic_no, first_name, mobile_no FROM voters WHERE epic_no = $1`, [voter1Epic]);
    const voter1InMaster = masterVoter1.rows.length === 1 && masterVoter1.rows[0].first_name === 'AutoSync';

    results.push({
      step: 'Step 1: Real-Time Voter CREATE Auto-Update',
      description: 'Tenant inserts a voter -> MasterAutoSync pushes to Master DB',
      passed: syncCreateRes && voter1InMaster,
      details: { syncCreateRes, masterRecord: masterVoter1.rows[0] },
    });

    // -------------------------------------------------------------
    // Step 2: Forward Auto-Update: Tenant Voter UPDATE -> Master DB
    // -------------------------------------------------------------
    const updatedMobile = '9111222333';
    const updateTime = new Date(Date.now() + 2000);
    const voter1UpdatedPayload = {
      ...voter1Payload,
      mobileNo: updatedMobile,
      isFamilyInfluencer: true,
      updatedAt: updateTime,
    };

    // Update in Tenant DB
    await tenantPool.query(
      `UPDATE voters SET mobile_no = $1, is_family_influencer = true, updated_at = $2 WHERE id = $3`,
      [updatedMobile, updateTime, voter1Id]
    );

    // Auto-sync update to Master DB
    const syncUpdateRes = await MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'voter',
      voter1Id,
      'UPDATE',
      voter1UpdatedPayload,
      false,
      'tenant'
    );

    // Verify updated mobile and influencer flag in Master DB
    const masterUpdatedVoter = await masterQuery(
      `SELECT id, epic_no, mobile_no, is_family_influencer FROM voters WHERE epic_no = $1`,
      [voter1Epic]
    );
    const updateVerified =
      masterUpdatedVoter.rows.length === 1 &&
      masterUpdatedVoter.rows[0].mobile_no === updatedMobile &&
      masterUpdatedVoter.rows[0].is_family_influencer === true;

    results.push({
      step: 'Step 2: Real-Time Voter UPDATE Auto-Update',
      description: 'Tenant modifies voter data -> Master DB reflects updated values immediately',
      passed: syncUpdateRes && updateVerified,
      details: { syncUpdateRes, masterRecord: masterUpdatedVoter.rows[0] },
    });

    // -------------------------------------------------------------
    // Step 3: Conflict Resolution & Timestamp LWW (Last-Write-Wins)
    // -------------------------------------------------------------
    // Attempt sync with an obsolete/stale timestamp (e.g. 1 hour ago)
    const staleTime = new Date(Date.now() - 3600 * 1000);
    const stalePayload = {
      ...voter1Payload,
      mobileNo: '9000000000', // Stale value
      updatedAt: staleTime,
    };

    await MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'voter',
      voter1Id,
      'UPDATE',
      stalePayload,
      false,
      'tenant'
    );

    // Check Master DB: The mobile should NOT have reverted to 9000000000
    const masterAfterStale = await masterQuery(
      `SELECT mobile_no FROM voters WHERE epic_no = $1`,
      [voter1Epic]
    );
    const lwwVerified = masterAfterStale.rows[0]?.mobile_no === updatedMobile;

    results.push({
      step: 'Step 3: Conflict Resolution & LWW (Last-Write-Wins)',
      description: 'Ensure stale timestamps do not overwrite newer updates in Master DB',
      passed: lwwVerified,
      details: { currentMobile: masterAfterStale.rows[0]?.mobile_no, expected: updatedMobile },
    });

    // -------------------------------------------------------------
    // Step 4: Batch Voter Synchronization (High-Performance Chunking)
    // -------------------------------------------------------------
    const batchVoters = [
      {
        id: 'b1111111-1111-4111-8111-111111111111',
        epicNo: `${testEpicPrefix}_BATCH_1`,
        firstName: 'BatchOne',
        surname: 'Test',
        stateId: state_id,
        districtId: district_id,
        pcId: pc_id,
        acId: ac_id,
        boothId: booth_id,
        mobileNo: '9888800001',
        updatedAt: new Date(),
      },
      {
        id: 'b2222222-2222-4222-8222-222222222222',
        epicNo: `${testEpicPrefix}_BATCH_2`,
        firstName: 'BatchTwo',
        surname: 'Test',
        stateId: state_id,
        districtId: district_id,
        pcId: pc_id,
        acId: ac_id,
        boothId: booth_id,
        mobileNo: '9888800002',
        updatedAt: new Date(),
      },
    ];

    const batchRes = await MasterAutoSyncService.syncVotersBatchToMaster(tenantPool, batchVoters);
    const masterBatchCheck = await masterQuery(
      `SELECT COUNT(*)::int AS count FROM voters WHERE epic_no IN ($1, $2)`,
      [batchVoters[0].epicNo, batchVoters[1].epicNo]
    );
    const batchPassed = batchRes.inserted === 2 && masterBatchCheck.rows[0]?.count === 2;

    results.push({
      step: 'Step 4: Batch Voter Auto-Update',
      description: 'Synchronizes multi-row voter arrays to Master DB using bulk UPSERT',
      passed: batchPassed,
      details: { batchResult: batchRes, masterCount: masterBatchCheck.rows[0]?.count },
    });

    // -------------------------------------------------------------
    // Step 5: Transactional Outbox Pattern & Immediate Dispatch
    // -------------------------------------------------------------
    const outboxEpic = `${testEpicPrefix}_OUTBOX`;
    const outboxVoterId = 'c3333333-3333-4333-8333-333333333333';
    const outboxPayload = {
      id: outboxVoterId,
      epicNo: outboxEpic,
      firstName: 'OutboxVoter',
      surname: 'Tester',
      stateId: state_id,
      districtId: district_id,
      pcId: pc_id,
      acId: ac_id,
      boothId: booth_id,
      mobileNo: '9777700001',
      updatedAt: new Date(),
    };

    await TransactionalOutbox.executeAndEnqueue(
      tenantPool,
      'voter',
      'CREATE',
      async (client) => {
        const insertRes = await client.query(
          `INSERT INTO voters (id, epic_no, first_name, surname, state_id, district_id, pc_id, ac_id, booth_id, mobile_no, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING *`,
          [
            outboxPayload.id,
            outboxPayload.epicNo,
            outboxPayload.firstName,
            outboxPayload.surname,
            outboxPayload.stateId,
            outboxPayload.districtId,
            outboxPayload.pcId,
            outboxPayload.acId,
            outboxPayload.boothId,
            outboxPayload.mobileNo,
          ]
        );
        return {
          entityId: outboxVoterId,
          payload: outboxPayload,
          result: insertRes.rows[0],
        };
      }
    );

    // Wait a brief moment (500ms) for async background dispatch
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Verify outbox entry in Tenant DB
    const outboxEntryRes = await tenantPool.query(
      `SELECT id, status, retry_count FROM tenant_sync_outbox WHERE entity_id = $1`,
      [outboxVoterId]
    );
    // Verify voter in Master DB
    const masterOutboxCheck = await masterQuery(
      `SELECT id, epic_no, first_name FROM voters WHERE epic_no = $1`,
      [outboxEpic]
    );

    const outboxPassed =
      outboxEntryRes.rows.length > 0 &&
      outboxEntryRes.rows[0].status === 'synced' &&
      masterOutboxCheck.rows.length === 1;

    results.push({
      step: 'Step 5: Transactional Outbox Pattern Execution',
      description: 'Enqueue mutation in tenant_sync_outbox & dispatch async flush to Master DB',
      passed: outboxPassed,
      details: {
        outboxRow: outboxEntryRes.rows[0],
        masterRecord: masterOutboxCheck.rows[0],
      },
    });

    // -------------------------------------------------------------
    // Step 6: Offline Resilience & Outbox Background Worker Recovery
    // -------------------------------------------------------------
    const offlineEpic = `${testEpicPrefix}_OFFLINE`;
    const offlineVoterId = 'd4444444-4444-4444-8444-444444444444';
    const offlinePayload = {
      id: offlineVoterId,
      epicNo: offlineEpic,
      firstName: 'OfflineVoter',
      surname: 'RecoveryTest',
      stateId: state_id,
      districtId: district_id,
      pcId: pc_id,
      acId: ac_id,
      boothId: booth_id,
      mobileNo: '9666600001',
      updatedAt: new Date(),
    };

    // Simulate an offline / un-synced outbox item directly in tenant_sync_outbox
    await tenantPool.query(
      `INSERT INTO tenant_sync_outbox (entity_type, entity_id, action, payload, origin, status, retry_count, error_message, created_at, updated_at)
       VALUES ('voter', $1, 'CREATE', $2, 'tenant', 'pending', 0, 'Simulated network disconnection', NOW(), NOW())`,
      [offlineVoterId, JSON.stringify(offlinePayload)]
    );

    // Run the background retry worker
    const processedOutboxCount = await SyncOutboxRetryService.processTenantOutbox(tenantDbName);

    // Verify the offline item got pushed to Master DB and marked 'synced'
    const masterOfflineCheck = await masterQuery(
      `SELECT id, epic_no, first_name FROM voters WHERE epic_no = $1`,
      [offlineEpic]
    );
    const outboxOfflineStatus = await tenantPool.query(
      `SELECT status FROM tenant_sync_outbox WHERE entity_id = $1`,
      [offlineVoterId]
    );

    const offlineRecoveryPassed =
      processedOutboxCount >= 1 &&
      masterOfflineCheck.rows.length === 1 &&
      outboxOfflineStatus.rows[0]?.status === 'synced';

    results.push({
      step: 'Step 6: Offline Outbox Worker Recovery',
      description: 'SyncOutboxRetryService scans pending outbox rows and successfully reconciles with Master DB',
      passed: offlineRecoveryPassed,
      details: {
        processedCount: processedOutboxCount,
        masterRecord: masterOfflineCheck.rows[0],
        outboxStatus: outboxOfflineStatus.rows[0]?.status,
      },
    });

    // -------------------------------------------------------------
    // Step 7: Anti-Echo Prevention (Loop Protection)
    // -------------------------------------------------------------
    const antiEchoRes = await MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'voter',
      voter1Id,
      'UPDATE',
      voter1Payload,
      false,
      'master' // Originated from master
    );
    // When origin is master, it must return true immediately without modifying DB or re-queueing
    results.push({
      step: 'Step 7: Anti-Echo Circular Sync Guard',
      description: 'Records marked origin = master are recognized and exempted from echo loops',
      passed: antiEchoRes === true,
      details: { origin: 'master', skippedEcho: true },
    });

    // -------------------------------------------------------------
    // Step 8: Entity Deletion Auto-Update
    // -------------------------------------------------------------
    // Delete voter1 from tenant and verify auto-deletion in master
    await tenantPool.query(`DELETE FROM voters WHERE id = $1`, [voter1Id]);
    await MasterAutoSyncService.syncEntityToMaster(
      tenantPool,
      'voter',
      voter1Id,
      'DELETE',
      { id: voter1Id },
      false,
      'tenant'
    );

    const masterDeleteCheck = await masterQuery(`SELECT id FROM voters WHERE id = $1`, [voter1Id]);
    const deletePassed = masterDeleteCheck.rows.length === 0;

    results.push({
      step: 'Step 8: Real-Time DELETE Auto-Update',
      description: 'Deletion in tenant DB propagates immediately to Master DB',
      passed: deletePassed,
      details: { deletedFromMaster: deletePassed },
    });

    // -------------------------------------------------------------
    // Step 9: Cleanup & Post-Flight Sync Health Audit
    // -------------------------------------------------------------
    // Clean all test EPICs from both Tenant DB and Master DB
    const allTestEpics = [
      voter1Epic,
      batchVoters[0].epicNo,
      batchVoters[1].epicNo,
      outboxEpic,
      offlineEpic,
    ];
    await tenantPool.query(`DELETE FROM voters WHERE epic_no = ANY($1)`, [allTestEpics]);
    await masterQuery(`DELETE FROM voters WHERE epic_no = ANY($1)`, [allTestEpics]);
    await tenantPool.query(`DELETE FROM tenant_sync_outbox WHERE entity_id = ANY($1)`, [
      [voter1Id, batchVoters[0].id, batchVoters[1].id, outboxVoterId, offlineVoterId],
    ]);

    // Check final sync health
    const postSyncStatus = await TenantSyncService.checkDbSyncStatus(tenantId);
    const postSyncHealthy = postSyncStatus.isReachable && postSyncStatus.syncStatus === 'synced';

    results.push({
      step: 'Step 9: Post-Flight Sync Parity & Cleanup Verification',
      description: 'Ensure clean purge of test fixtures and confirm 100% database parity',
      passed: postSyncHealthy,
      details: {
        syncStatus: postSyncStatus.syncStatus,
        voterCountDiff: postSyncStatus.voterCountDiff,
        isSchemaSynced: postSyncStatus.isSchemaSynced,
        isDataSynced: postSyncStatus.isDataSynced,
      },
    });
  } catch (err: any) {
    logger.error('Test execution failed with error:', err);
    results.push({
      step: 'Test Suite Failure',
      description: 'An unexpected exception occurred during test execution',
      passed: false,
      error: err.message,
    });
  } finally {
    if (tenantPool) {
      await tenantPool.end().catch(() => {});
    }
    await closeDbPool();
  }

  // -------------------------------------------------------------
  // Print Detailed Report
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 AUTOUPDATE & SYNC TEST EXECUTION RESULTS');
  console.log('================================================================');
  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} | ${r.step}`);
    console.log(`       Description: ${r.description}`);
    if (r.details) {
      console.log(`       Details: ${JSON.stringify(r.details)}`);
    }
    if (r.error) {
      console.log(`       Error: ${r.error}`);
    }
    if (!r.passed) allPassed = false;
  }
  console.log('================================================================');
  console.log(`Final Verdict: ${allPassed ? '🎉 ALL 10 TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  console.log('================================================================\n');

  return { allPassed, results };
}

runAutoUpdateSyncTest()
  .then(({ allPassed }) => {
    process.exit(allPassed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
