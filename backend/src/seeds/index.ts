import { logger } from '../utils/logger';
import { seedMasters } from './seeders/master.seeder';
import { seedAdminUsers } from './seeders/admin_user.seeder';
import { seedVoters } from './seeders/voter.seeder';

const runSeeders = async (): Promise<void> => {
  logger.info('==========================================');
  logger.info('🚀 Starting Database Seeding Script');
  logger.info('==========================================');

  try {
    await seedMasters();
    await seedAdminUsers();
    await seedVoters(1000);
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

