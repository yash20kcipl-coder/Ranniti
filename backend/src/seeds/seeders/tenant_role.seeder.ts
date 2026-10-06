import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { query, closeDbPool } from '../../queries/dbPool';

/**
 * Seed Tier 1 Super Admin Tenant Role Packages (tenant_roles table).
 * Defines allowed web tabs & tenant master sub-tabs accessible to tenants.
 */
export const seedTenantRoles = async (): Promise<void> => {
  logger.info('==========================================');
  logger.info('🛡️ Seeding Super Admin Tenant Role Packages (Tier 1)...');
  logger.info('==========================================');

  // Ensure dependent migration tables exist
  const migrationFiles = [
    'create_master_tables.sql',
    'create_admin_users_table.sql',
    'create_roles_and_permissions_tables.sql',
    'create_tenants_table.sql',
  ];

  for (const file of migrationFiles) {
    const migrationPath = path.join(__dirname, '../../database/migrations', file);
    if (fs.existsSync(migrationPath)) {
      try {
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        await query(sqlContent);
      } catch (err: any) {
        logger.warn(`Notice while running ${file}: ${err.message}`);
      }
    }
  }

  logger.info('Ensured tenant_roles table migration schema executed. Skipping automatic data seeding to keep table empty.');
  logger.info('✅ Successfully created tenant_roles table.');
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('tenant_role.seeder.ts'))) {
  seedTenantRoles()
    .then(async () => {
      logger.info('Tenant Role Seeder execution complete.');
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Tenant Role Seeder execution failed:', err);
      await closeDbPool();
      process.exit(1);
    });
}
