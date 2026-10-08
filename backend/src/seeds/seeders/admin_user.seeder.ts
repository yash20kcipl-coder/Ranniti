import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { RoleQueries } from '../../queries/role.queries';
import { authService } from '../../services/auth.service';
import { initialAdminUserSeeds } from '../data/admin_users.seed';

export const seedAdminUsers = async (): Promise<void> => {
  logger.info('Seeding admin users and tenant admin accounts dataset...');
  let count = 0;
  const defaultRole = await RoleQueries.getDefaultTenantRole();

  for (const userData of initialAdminUserSeeds) {
    if (userData.role === 'super_admin') {
      try {
        await authService.registerUser({
          name: userData.name,
          roleName: userData.roleName,
          email: userData.email,
          password: userData.password,
          role: 'super_admin',
          mobile: userData.mobile,
        });
        count++;
        logger.info(`Seeded Super Admin user: ${userData.name} (${userData.email})`);
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          const passwordHash = await (await import('../../utils/password')).hashPassword(userData.password);
          await query(
            `UPDATE admin_users
             SET name = $1, role_name = $2, role = 'super_admin', mobile = COALESCE($3, mobile), avatar = COALESCE($4, avatar), password_hash = $5, updated_at = NOW()
             WHERE email = $6`,
            [
              userData.name,
              userData.roleName || null,
              userData.mobile || null,
              userData.avatar || null,
              passwordHash,
              userData.email.toLowerCase().trim(),
            ]
          );
          count++;
          logger.info(`Updated existing Super Admin user: ${userData.name} (${userData.email})`);
        } else {
          logger.warn(`Skipped seeding Super Admin '${userData.email}': ${err.message}`);
        }
      }
    } else if (userData.role === 'tenant_admin' || userData.organizationName) {
      try {
        const passwordHash = await (await import('../../utils/password')).hashPassword(userData.password);
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
          `INSERT INTO tenants (
             name, email, password_hash, mobile, avatar, organization_name, tenant_db_name, pc_ids, ac_ids, tenant_role_id, status, provisioning_progress, current_step
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', 100, 'completed')
           ON CONFLICT (tenant_db_name) DO UPDATE
           SET name = EXCLUDED.name,
               email = EXCLUDED.email,
               password_hash = EXCLUDED.password_hash,
               mobile = COALESCE(EXCLUDED.mobile, tenants.mobile),
               avatar = COALESCE(EXCLUDED.avatar, tenants.avatar),
               organization_name = EXCLUDED.organization_name,
               pc_ids = EXCLUDED.pc_ids,
               ac_ids = EXCLUDED.ac_ids,
               tenant_role_id = COALESCE(tenants.tenant_role_id, EXCLUDED.tenant_role_id),
               status = 'active',
               provisioning_progress = 100,
               current_step = 'completed',
               updated_at = NOW()`,
          [
            userData.name,
            userData.email.toLowerCase().trim(),
            passwordHash,
            userData.mobile || null,
            userData.avatar || null,
            userData.organizationName || 'Ranniti Campaign Cell',
            userData.tenantDbName || 'ranniti_tenant_admin_5667',
            targetPcIds,
            targetAcIds,
            defaultRole?.id || null,
          ]
        );

        count++;
        logger.info(`Seeded Tenant Admin account: ${userData.name} (${userData.email}) [Org: ${userData.organizationName}]`);
      } catch (err: any) {
        logger.warn(`Failed to configure tenant for '${userData.email}': ${err.message}`);
      }
    }
  }

  if (defaultRole) {
    await query(`UPDATE tenants SET tenant_role_id = $1 WHERE tenant_role_id IS NULL`, [defaultRole.id]);
  }

  logger.info(`Successfully finished admin & tenant user seeding. Processed ${count} records.`);
};

/**
 * Provisions dedicated PostgreSQL databases and copies voter datasets for all seeded tenant admins.
 */
export const seedTenantDatabases = async (): Promise<void> => {
  const { tenantProvisioningService } = await import('../../provisioning/services/tenantProvisioning.service');
  logger.info('==========================================');
  logger.info('📦 Seeding Tenant Databases & Transferring Voters...');
  logger.info('==========================================');

  const tenantUsersRes = await query(
    `SELECT id, email, tenant_db_name, ac_ids, pc_ids
     FROM tenants
     WHERE tenant_db_name IS NOT NULL`
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
