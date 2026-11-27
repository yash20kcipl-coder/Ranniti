import { TenantPoolManager } from '../services/pool/tenantPoolManager';
import { closeDbPool } from '../queries/dbPool';
import { logger } from '../utils/logger';

const TARGET_TENANT_DB = 'ranniti_tenant_prince_2873';
const DEMO_ELECTION_CODE = 'DEMO_PRINCE_2026';

async function seedDemoVotingData() {
  logger.info(`🚀 Seeding reversible demo voting data into '${TARGET_TENANT_DB}'...`);

  // 1. Check if demo election already exists
  const existing = await TenantPoolManager.query(
    TARGET_TENANT_DB,
    `SELECT id FROM elections WHERE election_code = $1 LIMIT 1`,
    [DEMO_ELECTION_CODE]
  );

  let electionId: string;
  if (existing.rows.length > 0) {
    electionId = existing.rows[0].id;
    logger.info(`Demo election already exists (${electionId}). Refreshing turnout rows...`);
    await TenantPoolManager.query(
      TARGET_TENANT_DB,
      `DELETE FROM voter_election_statuses WHERE election_id = $1::uuid`,
      [electionId]
    );
    await TenantPoolManager.query(
      TARGET_TENANT_DB,
      `DELETE FROM election_booth_turnout WHERE election_id = $1::uuid`,
      [electionId]
    );
  } else {
    // Get AC/PC/State from existing booths/voters if available
    const geoRes = await TenantPoolManager.query(
      TARGET_TENANT_DB,
      `SELECT state_id, pc_id, ac_id FROM voters WHERE ac_id IS NOT NULL LIMIT 1`
    );
    const geo = geoRes.rows[0] || {};
    const totalVotersRes = await TenantPoolManager.query(
      TARGET_TENANT_DB,
      `SELECT COUNT(*)::int AS cnt FROM voters WHERE is_dead = false`
    );
    const totalVoters = totalVotersRes.rows[0]?.cnt || 0;

    // Clear existing default flag only if none exists? Better: leave existing elections untouched, set is_default = true if no default exists
    const hasDefaultRes = await TenantPoolManager.query(
      TARGET_TENANT_DB,
      `SELECT 1 FROM elections WHERE is_default = true LIMIT 1`
    );
    const shouldSetDefault = hasDefaultRes.rows.length === 0;

    const insertRes = await TenantPoolManager.query(
      TARGET_TENANT_DB,
      `INSERT INTO elections (
         name, election_code, election_type, election_date, state_id, pc_id, ac_id,
         is_active, is_default, status, total_voters_snapshot, target_votes, description
       ) VALUES (
         'Demo Assembly Election 2026', $1, 'ASSEMBLY', CURRENT_DATE,
         $2, $3, $4, true, $5, 'ACTIVE', $6, $7,
         'Reversible demo election data for testing Voting Report'
       )
       RETURNING id`,
      [
        DEMO_ELECTION_CODE,
        geo.state_id || null,
        geo.pc_id || null,
        geo.ac_id || null,
        shouldSetDefault,
        totalVoters,
        Math.round(totalVoters * 0.65),
      ]
    );
    electionId = insertRes.rows[0].id;
    logger.info(`✅ Created demo election '${DEMO_ELECTION_CODE}' (${electionId})`);
  }

  // 2. Pick active volunteers to attribute marked votes
  const volRes = await TenantPoolManager.query(
    TARGET_TENANT_DB,
    `SELECT id FROM tenant_users WHERE status = 'active' ORDER BY created_at ASC LIMIT 5`
  );
  const volunteerIds: string[] = volRes.rows.map((r: any) => r.id);

  // 3. Insert realistic voter_election_statuses (deterministic ~45-65% voted per booth using hashtext)
  await TenantPoolManager.query(
    TARGET_TENANT_DB,
    `INSERT INTO voter_election_statuses (
       election_id, voter_id, booth_id, has_voted, voted_at, marked_by_user_id
     )
     SELECT
       $1::uuid,
       v.id,
       v.booth_id,
       true,
       NOW() - ((abs(hashtext(v.id::text)) % 480) || ' minutes')::interval,
       CASE
         WHEN array_length($2::uuid[], 1) > 0
         THEN ($2::uuid[])[1 + (abs(hashtext(v.id::text)) % array_length($2::uuid[], 1))]
         ELSE NULL
       END
     FROM voters v
     WHERE v.is_dead = false
       AND v.booth_id IS NOT NULL
       AND (abs(hashtext(v.id::text)) % 100) < (38 + (abs(hashtext(v.booth_id::text)) % 35))
     ON CONFLICT (election_id, voter_id) DO NOTHING`,
    [electionId, volunteerIds]
  );

  // 4. Populate pre-aggregated election_booth_turnout from voters + voter_election_statuses
  await TenantPoolManager.query(
    TARGET_TENANT_DB,
    `INSERT INTO election_booth_turnout (
       election_id, booth_id, total_voters, voted_count,
       male_voted_count, female_voted_count, other_voted_count, last_voted_at, updated_at
     )
     SELECT
       $1::uuid,
       b.id,
       COUNT(v.id)::int AS total_voters,
       COUNT(ves.id) FILTER (WHERE ves.has_voted = true)::int AS voted_count,
       COUNT(ves.id) FILTER (WHERE ves.has_voted = true AND LOWER(COALESCE(v.gender, '')) IN ('male', 'm'))::int AS male_voted_count,
       COUNT(ves.id) FILTER (WHERE ves.has_voted = true AND LOWER(COALESCE(v.gender, '')) IN ('female', 'f'))::int AS female_voted_count,
       COUNT(ves.id) FILTER (WHERE ves.has_voted = true AND LOWER(COALESCE(v.gender, '')) NOT IN ('male', 'm', 'female', 'f'))::int AS other_voted_count,
       MAX(ves.voted_at) AS last_voted_at,
       NOW()
     FROM booths b
     LEFT JOIN voters v ON v.booth_id = b.id AND v.is_dead = false
     LEFT JOIN voter_election_statuses ves ON ves.voter_id = v.id AND ves.election_id = $1::uuid
     GROUP BY b.id
     ON CONFLICT (election_id, booth_id) DO UPDATE SET
       total_voters = EXCLUDED.total_voters,
       voted_count = EXCLUDED.voted_count,
       male_voted_count = EXCLUDED.male_voted_count,
       female_voted_count = EXCLUDED.female_voted_count,
       other_voted_count = EXCLUDED.other_voted_count,
       last_voted_at = EXCLUDED.last_voted_at,
       updated_at = NOW()`,
    [electionId]
  );

  const summaryRes = await TenantPoolManager.query(
    TARGET_TENANT_DB,
    `SELECT
       COUNT(*)::int AS booths,
       COALESCE(SUM(total_voters), 0)::int AS total_voters,
       COALESCE(SUM(voted_count), 0)::int AS voted_count
     FROM election_booth_turnout WHERE election_id = $1::uuid`,
    [electionId]
  );

  const s = summaryRes.rows[0];
  logger.info(
    `✅ Demo voting data ready in '${TARGET_TENANT_DB}': ${s.booths} booths, ${s.voted_count}/${s.total_voters} voted.`
  );
}

async function cleanupDemoVotingData() {
  logger.info(`🧹 Removing demo voting data ('${DEMO_ELECTION_CODE}') from '${TARGET_TENANT_DB}'...`);
  const delRes = await TenantPoolManager.query(
    TARGET_TENANT_DB,
    `DELETE FROM elections WHERE election_code = $1 RETURNING id, name`,
    [DEMO_ELECTION_CODE]
  );
  if (delRes.rows.length === 0) {
    logger.info('ℹ️ No demo election found to remove.');
  } else {
    logger.info(
      `✅ Removed demo election '${delRes.rows[0].name}' (${delRes.rows[0].id}) and cascaded all turnout/status rows.`
    );
  }
}

async function main() {
  const isCleanup = process.argv.includes('--cleanup');
  try {
    if (isCleanup) {
      await cleanupDemoVotingData();
    } else {
      await seedDemoVotingData();
    }
  } catch (err) {
    logger.error('❌ Demo voting script failed:', err);
    process.exitCode = 1;
  } finally {
    await TenantPoolManager.closeAll();
    await closeDbPool();
    process.exit(process.exitCode ?? 0);
  }
}

main();
