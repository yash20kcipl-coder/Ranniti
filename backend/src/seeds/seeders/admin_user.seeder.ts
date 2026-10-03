import { logger } from '../../utils/logger';
import { authService } from '../../services/auth.service';
import { initialAdminUserSeeds } from '../data/admin_users.seed';
import { query } from '../../queries/dbPool';
import { RoleQueries } from '../../queries/role.queries';

export const seedAdminUsers = async (): Promise<void> => {
  logger.info('Seeding admin users dataset...');
  let count = 0;
  const defaultRole = await RoleQueries.getDefaultTenantRole();

  for (const userData of initialAdminUserSeeds) {
    try {
      await authService.registerUser({
        name: userData.name,
        roleName: userData.roleName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        mobile: userData.mobile,
      });
      count++;
      logger.info(`Seeded admin user: ${userData.name} (${userData.email}) [Role: ${userData.role}, Title: ${userData.roleName || 'N/A'}]`);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        const passwordHash = await (await import('../../utils/password')).hashPassword(userData.password);
        await query(
          `UPDATE admin_users
           SET name = $1, role_name = $2, role = $3, mobile = COALESCE($4, mobile), avatar = COALESCE($5, avatar), password_hash = $6, updated_at = NOW()
           WHERE email = $7`,
          [
            userData.name,
            userData.roleName || null,
            userData.role,
            userData.mobile || null,
            userData.avatar || null,
            passwordHash,
            userData.email.toLowerCase().trim(),
          ]
        );
        count++;
        logger.info(`Updated existing admin user: ${userData.name} (${userData.email}) [Role: ${userData.role}, Title: ${userData.roleName || 'N/A'}]`);
      } else {
        logger.warn(`Skipped seeding admin user '${userData.email}': ${err.message}`);
      }
    }

    // Seed tenant assignment if tenant details are provided
    if (userData.organizationName && userData.tenantDbName) {
      try {
        const userRes = await query(`SELECT id FROM admin_users WHERE email = $1`, [userData.email.toLowerCase().trim()]);
        const userId = userRes.rows[0]?.id;

        if (userId) {
          await query(`UPDATE admin_users SET tenant_db_name = $1 WHERE id = $2`, [userData.tenantDbName, userId]);

          let targetPcIds: string[] = [];
          let targetAcIds: string[] = [];

          if (userData.assignedPcName) {
            const pcRes = await query(`SELECT id FROM parliamentary_constituencies WHERE LOWER(name) = LOWER($1) LIMIT 1`, [userData.assignedPcName]);
            const pcId = pcRes.rows[0]?.id;
            if (pcId) {
              targetPcIds = [pcId];
              const acsForPc = await query(`SELECT id FROM assembly_constituencies WHERE pc_id = $1 ORDER BY ac_number ASC`, [pcId]);
              targetAcIds = acsForPc.rows.map((r: any) => r.id);
            }
          }

          if (targetAcIds.length === 0) {
            const acRes = await query(`SELECT id, pc_id FROM assembly_constituencies LIMIT 6`);
            targetAcIds = acRes.rows.map((r: any) => r.id);
            targetPcIds = Array.from(new Set(acRes.rows.map((r: any) => r.pc_id).filter(Boolean)));
          }

          await query(
            `INSERT INTO tenant_assignments (user_id, organization_name, tenant_db_name, pc_ids, ac_ids, tenant_role_id, status, provisioning_progress, current_step)
             VALUES ($1, $2, $3, $4, $5, $6, 'active', 100, 'completed')
             ON CONFLICT (tenant_db_name) DO UPDATE
             SET organization_name = EXCLUDED.organization_name,
                 pc_ids = EXCLUDED.pc_ids,
                 ac_ids = EXCLUDED.ac_ids,
                 tenant_role_id = COALESCE(tenant_assignments.tenant_role_id, EXCLUDED.tenant_role_id),
                 status = 'active',
                 provisioning_progress = 100,
                 current_step = 'completed',
                 updated_at = NOW()`,
            [userId, userData.organizationName, userData.tenantDbName, targetPcIds, targetAcIds, defaultRole?.id || null]
          );
          logger.info(`Seeded active tenant assignment for '${userData.organizationName}' (${userData.tenantDbName}) with ${targetAcIds.length} ACs in PC.`);
        }
      } catch (err: any) {
        logger.warn(`Failed to configure tenant assignment for '${userData.email}': ${err.message}`);
      }
    }
  }

  if (defaultRole) {
    await query(`UPDATE tenant_assignments SET tenant_role_id = $1 WHERE tenant_role_id IS NULL`, [defaultRole.id]);
  }

  logger.info(`Successfully finished admin user seeding. Processed ${count} records.`);
};

/**
 * Provisions dedicated PostgreSQL databases and copies voter datasets for all seeded tenant admins.
 */
export const seedTenantDatabases = async (): Promise<void> => {
  const { tenantProvisioningService } = await import('../../services/tenantProvisioning.service');
  logger.info('==========================================');
  logger.info('📦 Seeding Tenant Databases & Transferring Voters...');
  logger.info('==========================================');

  const tenantUsersRes = await query(
    `SELECT u.id, u.email, u.tenant_db_name, ta.ac_ids, ta.pc_ids
     FROM admin_users u
     JOIN tenant_assignments ta ON ta.user_id = u.id
     WHERE u.role = 'tenant_admin'`
  );

  for (const tenant of tenantUsersRes.rows) {
    if (!tenant.tenant_db_name) continue;
    logger.info(`Provisioning database for tenant '${tenant.email}' (${tenant.tenant_db_name})...`);
    await tenantProvisioningService.provisionTenantDataAsync(
      tenant.id,
      tenant.tenant_db_name,
      tenant.ac_ids || [],
      tenant.pc_ids || []
    );
  }

  logger.info('Finished tenant database seeding & voter data copying.');
};

export const seedUsers = seedAdminUsers; // Alias for backward compatibility
