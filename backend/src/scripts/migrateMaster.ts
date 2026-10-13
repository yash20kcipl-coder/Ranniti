import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { query, closeDbPool } from '../queries/dbPool';

const migrationFiles = [
  'create_master_tables.sql',
  'create_roles_and_permissions_tables.sql',
  'create_admin_users_table.sql',
  'create_tenants_table.sql',
  'create_campaign_settings_tables.sql',
  'create_voters_table.sql',
  'create_otp_verifications_table.sql',
  'create_app_versions_table.sql',
  'create_audit_logs_table.sql',
  'create_bulk_upload_demos_table.sql',
  'create_tenant_dashboard_stats_table.sql',
  'remove_push_triggers_column.sql',
  'remove_tenant_whatsapp_config_and_templates.sql',
  'remove_voter_type_column.sql',
];

export async function runMasterMigrations(): Promise<void> {
  logger.info('🚀 Executing Master Database Migrations...');
  const candidateDirs = [
    path.join(__dirname, '../database/migrations'),
    path.join(__dirname, '../../src/database/migrations'),
    path.join(process.cwd(), 'src/database/migrations'),
    path.join(process.cwd(), 'dist/database/migrations'),
    path.join(process.cwd(), 'backend/src/database/migrations'),
    path.join(process.cwd(), 'backend/dist/database/migrations'),
  ];
  const migrationsDir =
    candidateDirs.find((dir) => fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.sql'))) ||
    candidateDirs[0];

  for (const fileName of migrationFiles) {
    const filePath = path.join(migrationsDir, fileName);
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8');
      await query(sql);
      logger.info(`✅ Executed migration '${fileName}' on Master DB`);
    } else {
      logger.warn(`⚠️ Migration file not found: ${fileName}`);
    }
  }

  logger.info('🎉 All Master Database Migrations applied successfully.');
}

if (require.main === module) {
  runMasterMigrations()
    .then(() => closeDbPool())
    .then(() => process.exit(0))
    .catch(async (err) => {
      logger.error('❌ Master Database Migration Failed:', err);
      await closeDbPool();
      process.exit(1);
    });
}
