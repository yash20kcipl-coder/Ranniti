import { logger } from '../../utils/logger';
import { query, closeDbPool } from '../../queries/dbPool';
import { TenantPoolManager } from '../../services/pool/tenantPoolManager';

const DEMO_ID_PREFIX = '00000000-de00-4000-8000-';

const DEMO_FIELD_UPDATES = [
  { fieldName: 'mobile_no', oldValue: null, newValue: '9876543210', points: 15 },
  { fieldName: 'party_id', oldValue: 'Undecided', newValue: 'BJP', points: 20 },
  { fieldName: 'caste_id', oldValue: null, newValue: 'Patel', points: 10 },
  { fieldName: 'subcaste_name', oldValue: null, newValue: 'Kadva Patel', points: 5 },
  { fieldName: 'religion_id', oldValue: null, newValue: 'Hindu', points: 5 },
  { fieldName: 'profession', oldValue: null, newValue: 'Business', points: 5 },
  { fieldName: 'is_family_influencer', oldValue: 'false', newValue: 'true', points: 15 },
  { fieldName: 'is_social_influencer', oldValue: 'false', newValue: 'true', points: 15 },
  { fieldName: 'status', oldValue: 'ACTIVE', newValue: 'ACTIVE', points: 10 },
  { fieldName: 'full_address', oldValue: null, newValue: '14 Shanti Nagar, Ward 4', points: 5 },
];

const makeDemoUuid = (index: number): string =>
  `${DEMO_ID_PREFIX}${String(index).padStart(12, '0')}`;

async function runSurveyDemoSeeder(removeOnly: boolean): Promise<void> {
  const tenantsRes = await query(
    `SELECT id, name, tenant_db_name AS "dbName" FROM tenants WHERE status IN ('ready', 'active') AND tenant_db_name IS NOT NULL`
  );

  for (const tenant of tenantsRes.rows) {
    const pool = TenantPoolManager.getPool(tenant.dbName);

    // Always clean previous demo rows first
    const delRes = await pool.query(
      `DELETE FROM volunteer_field_updates WHERE id::text LIKE $1`,
      [`${DEMO_ID_PREFIX}%`]
    );
    logger.info(`[SurveyDemo] Cleaned ${delRes.rowCount || 0} demo rows in '${tenant.dbName}'`);

    if (removeOnly) continue;

    const volunteersRes = await pool.query(
      `SELECT id, name FROM tenant_users WHERE status = 'active' ORDER BY created_at ASC LIMIT 5`
    );
    const votersRes = await pool.query(
      `SELECT id, booth_id FROM voters LIMIT 15`
    );

    if (volunteersRes.rows.length === 0 || votersRes.rows.length === 0) {
      logger.warn(`[SurveyDemo] Skipping '${tenant.dbName}': missing volunteers or voters`);
      continue;
    }

    let seq = 1;
    for (let vIdx = 0; vIdx < volunteersRes.rows.length; vIdx++) {
      const volunteer = volunteersRes.rows[vIdx];
      // Give each volunteer a different number of updates for realistic leaderboard ranking
      const updateCount = Math.max(3, 12 - vIdx * 2);

      for (let u = 0; u < updateCount; u++) {
        const voter = votersRes.rows[(vIdx * 3 + u) % votersRes.rows.length];
        const sample = DEMO_FIELD_UPDATES[(vIdx + u) % DEMO_FIELD_UPDATES.length];
        const hoursAgo = u * 3 + vIdx * 2;

        await pool.query(
          `INSERT INTO volunteer_field_updates
            (id, volunteer_id, voter_id, booth_id, field_name, old_value, new_value, points_awarded, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' hours')::interval)
           ON CONFLICT (id) DO NOTHING`,
          [
            makeDemoUuid(seq++),
            volunteer.id,
            voter.id,
            voter.booth_id || null,
            sample.fieldName,
            sample.oldValue,
            sample.newValue,
            sample.points,
            String(hoursAgo),
          ]
        );
      }
    }

    logger.info(`[SurveyDemo] Inserted ${seq - 1} removable demo survey updates in '${tenant.dbName}'`);
  }
}

if (require.main === module) {
  const removeOnly = process.argv.includes('--remove') || process.argv.includes('--clean');
  runSurveyDemoSeeder(removeOnly)
    .then(async () => {
      await TenantPoolManager.closeAll();
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('[SurveyDemo] Failed:', err);
      await TenantPoolManager.closeAll();
      await closeDbPool();
      process.exit(1);
    });
}
