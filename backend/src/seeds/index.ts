import { logger } from '../utils/logger';
import { seedRoles } from './seeders/role.seeder';
import { seedVoters } from './seeders/voter.seeder';
import { seedMasters } from './seeders/master.seeder';
import { seedAdminUsers, seedTenantDatabases } from './seeders/admin_user.seeder';
import { seedVolunteers } from './seeders/volunteer.seeder';
import { seedSettings, seedAllTenantSettings } from './seeders/setting.seeder';

const runSeeders = async (): Promise<void> => {
  logger.info('==========================================');
  logger.info('🚀 Starting Database Seeding Script');
  logger.info('==========================================');

  try {
    await seedMasters();
    await seedSettings();
    await seedRoles();
    await seedAdminUsers();
    await seedVoters(3500);
    await seedTenantDatabases();
    await seedVolunteers();
    await seedAllTenantSettings();
    logger.info('==========================================');
    logger.info('✅ Database Seeding Completed Successfully');
    logger.info('==========================================');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Database Seeding Failed:', error);
    process.exit(1);
  }
};

runSeeders();



