import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { query, closeDbPool } from '../../queries/dbPool';

/**
 * Seed Tier 2 System Default Tenant User Roles (tenant_user_roles table).
 * Defines granular user roles & field permissions: PC Leader, AC Leader, Sub-Leader, Volunteer.
 */
export const seedTenantUserRoles = async (): Promise<void> => {
  logger.info('==========================================');
  logger.info('👥 Seeding System Default Tenant User Roles (Tier 2)...');
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

  const defaultUserRoles = [
    {
      roleName: 'PC Leader',
      roleKey: 'pc_leader',
      description: 'Parliamentary Constituency Leader with full constituency overview and voter edit capabilities.',
      accessibleTabs: {
        webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
        masterSubTabs: ['pcs', 'acs', 'wards', 'booths', 'religions', 'castes', 'parties'],
        mobileScreens: ['voter_search', 'family_tree', 'survey', 'booth_analytics', 'gate_meetings'],
      },
      voterPermissions: {
        canViewVoter: true,
        canEditContact: true,
        canEditDemographics: true,
        canEditInclination: true,
        canEditVoterStatus: true,
        canManageFamily: true,
        canExportData: true,
      },
      canCreateRoles: ['ac_leader', 'sub_leader', 'supporter'],
      isSystemDefault: true,
    },
    {
      roleName: 'AC Leader',
      roleKey: 'ac_leader',
      description: 'Assembly Constituency Leader managing AC campaign activities and voter records.',
      accessibleTabs: {
        webTabs: ['dashboard', 'voter_directory', 'master_data'],
        masterSubTabs: ['acs', 'wards', 'booths', 'castes'],
        mobileScreens: ['voter_search', 'family_tree', 'survey', 'booth_analytics'],
      },
      voterPermissions: {
        canViewVoter: true,
        canEditContact: true,
        canEditDemographics: true,
        canEditInclination: true,
        canEditVoterStatus: true,
        canManageFamily: true,
        canExportData: false,
      },
      canCreateRoles: ['sub_leader', 'supporter'],
      isSystemDefault: true,
    },
    {
      roleName: 'Sub-Leader / Ward Coordinator',
      roleKey: 'sub_leader',
      description: 'Ward level coordinator responsible for local booth management and field survey entries.',
      accessibleTabs: {
        webTabs: ['dashboard', 'voter_directory'],
        masterSubTabs: ['booths'],
        mobileScreens: ['voter_search', 'family_tree', 'survey'],
      },
      voterPermissions: {
        canViewVoter: true,
        canEditContact: true,
        canEditDemographics: false,
        canEditInclination: true,
        canEditVoterStatus: false,
        canManageFamily: true,
        canExportData: false,
      },
      canCreateRoles: ['supporter'],
      isSystemDefault: true,
    },
    {
      roleName: 'Campaign Supporter / Volunteer',
      roleKey: 'supporter',
      description: 'Field volunteer with mobile voter lookup and survey submission capabilities.',
      accessibleTabs: {
        webTabs: ['dashboard', 'voter_directory'],
        masterSubTabs: [],
        mobileScreens: ['voter_search', 'survey'],
      },
      voterPermissions: {
        canViewVoter: true,
        canEditContact: false,
        canEditDemographics: false,
        canEditInclination: true,
        canEditVoterStatus: false,
        canManageFamily: false,
        canExportData: false,
      },
      canCreateRoles: [],
      isSystemDefault: true,
    },
  ];

  for (const role of defaultUserRoles) {
    const existing = await query(
      `SELECT id FROM tenant_user_roles WHERE role_key = $1 AND is_system_default = true LIMIT 1`,
      [role.roleKey]
    );

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO tenant_user_roles (
          role_name, role_key, description, accessible_tabs, voter_permissions, can_create_roles, is_system_default
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          role.roleName,
          role.roleKey,
          role.description,
          JSON.stringify(role.accessibleTabs),
          JSON.stringify(role.voterPermissions),
          JSON.stringify(role.canCreateRoles),
          role.isSystemDefault,
        ]
      );
    } else {
      await query(
        `UPDATE tenant_user_roles
         SET role_name = $1, description = $2, accessible_tabs = $3, voter_permissions = $4, can_create_roles = $5, updated_at = NOW()
         WHERE id = $6`,
        [
          role.roleName,
          role.description,
          JSON.stringify(role.accessibleTabs),
          JSON.stringify(role.voterPermissions),
          JSON.stringify(role.canCreateRoles),
          existing.rows[0].id,
        ]
      );
    }
  }

  logger.info(`✅ Successfully seeded ${defaultUserRoles.length} default tenant user roles.`);
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('tenant_user_role.seeder.ts'))) {
  seedTenantUserRoles()
    .then(async () => {
      logger.info('Tenant User Role Seeder execution complete.');
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Tenant User Role Seeder execution failed:', err);
      await closeDbPool();
      process.exit(1);
    });
}
