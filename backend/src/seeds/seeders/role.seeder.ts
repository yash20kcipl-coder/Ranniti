import { logger } from '../../utils/logger';
import { closeDbPool } from '../../queries/dbPool';
import { seedTenantRoles } from './tenant_role.seeder';
import { seedTenantUserRoles } from './tenant_user_role.seeder';

export { seedTenantRoles } from './tenant_role.seeder';
export { seedTenantUserRoles } from './tenant_user_role.seeder';

export const seedRoles = async (): Promise<void> => {
  logger.info('==========================================');
  logger.info('🔑 Starting Role Seeder Pipeline...');
  logger.info('==========================================');

  // 1. Seed Tier 1 Super Admin Tenant Role Packages
  await seedTenantRoles();

  // 2. Seed Tier 2 System Default Tenant User Roles (PC Leader, AC Leader, Sub-Leader, Supporter)
  await seedTenantUserRoles();

  logger.info('==========================================');
  logger.info('✅ Completed Role Seeder Pipeline.');
  logger.info('==========================================');
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('role.seeder.ts'))) {
  seedRoles()
    .then(async () => {
      logger.info('Role Seeder execution complete.');
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Role Seeder execution failed:', err);
      await closeDbPool();
      process.exit(1);
    });
}
