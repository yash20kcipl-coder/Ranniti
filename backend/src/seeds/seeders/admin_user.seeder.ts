import { logger } from '../../utils/logger';
import { authService } from '../../services/auth.service';
import { initialAdminUserSeeds } from '../data/admin_users.seed';

export const seedAdminUsers = async (): Promise<void> => {
  logger.info('Seeding admin users dataset...');
  let count = 0;

  for (const userData of initialAdminUserSeeds) {
    try {
      await authService.registerUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        mobile: userData.mobile,
      });
      count++;
      logger.info(`Seeded admin user: ${userData.name} (${userData.email}) [Role: ${userData.role}]`);
    } catch (err: any) {
      logger.warn(`Skipped seeding admin user '${userData.email}': ${err.message}`);
    }
  }

  logger.info(`Successfully finished admin user seeding. Inserted ${count} records.`);
};

export const seedUsers = seedAdminUsers; // Alias for backward compatibility


