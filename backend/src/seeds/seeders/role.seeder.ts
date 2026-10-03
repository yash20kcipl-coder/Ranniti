import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';

export const seedRoles = async (): Promise<void> => {
  logger.info('Seeding default role packages & tenant user roles...');

  // Ensure roles and permissions tables exist
  const migrationPath = path.join(__dirname, '../../database/migrations/create_roles_and_permissions_tables.sql');
  if (fs.existsSync(migrationPath)) {
    try {
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      await query(sqlContent);
    } catch (err: any) {
      logger.warn(`Notice while running create_roles_and_permissions_tables.sql: ${err.message}`);
    }
  }

  // 1. Seed Tier 1 Super Admin Tenant Role Packages
  const tenantRolePackages = [
    {
      roleName: 'Full Political Campaign Suite',
      description: 'Complete access to all web tabs, master sub-tabs, voter directory, and mobile field capabilities.',
      allowedTabs: {
        webTabs: ['dashboard', 'voter_directory', 'master_data'],
        masterSubTabs: ['acs', 'wards', 'booths'],
      },
      isActive: true,
      isDefault: true,
    },
    {
      roleName: 'Standard Campaign Package',
      description: 'Access to Dashboard, Voter Directory, Booth Master Data.',
      allowedTabs: {
        webTabs: ['dashboard', 'voter_directory', 'master_data'],
        masterSubTabs: ['wards', 'booths'],
      },
      isActive: true,
      isDefault: false,
    },
    {
      roleName: 'Voter Directory & Field Survey Package',
      description: 'Focused package for field operations with Voter Directory access and mobile survey capabilities.',
      allowedTabs: {
        webTabs: ['dashboard', 'voter_directory'],
        masterSubTabs: ['booths'],
      },
      isActive: true,
      isDefault: false,
    },
  ];

  for (const pkg of tenantRolePackages) {
    await query(
      `INSERT INTO tenant_roles (role_name, description, allowed_tabs, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (role_name) DO UPDATE
       SET description = EXCLUDED.description,
           allowed_tabs = EXCLUDED.allowed_tabs,
           is_active = EXCLUDED.is_active,
           is_default = EXCLUDED.is_default,
           updated_at = NOW()`,
      [pkg.roleName, pkg.description, JSON.stringify(pkg.allowedTabs), pkg.isActive, pkg.isDefault]
    );
  }
  logger.info(`Seeded ${tenantRolePackages.length} Super Admin Tenant Role packages.`);

  // 2. Seed Tier 2 System Default Tenant User Roles
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
          role_name, role_key, description, accessible_tabs, voter_permissions, is_system_default
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          role.roleName,
          role.roleKey,
          role.description,
          JSON.stringify(role.accessibleTabs),
          JSON.stringify(role.voterPermissions),
          role.isSystemDefault,
        ]
      );
    } else {
      await query(
        `UPDATE tenant_user_roles
         SET role_name = $1, description = $2, accessible_tabs = $3, voter_permissions = $4, updated_at = NOW()
         WHERE id = $5`,
        [
          role.roleName,
          role.description,
          JSON.stringify(role.accessibleTabs),
          JSON.stringify(role.voterPermissions),
          existing.rows[0].id,
        ]
      );
    }
  }

  logger.info(`Seeded ${defaultUserRoles.length} default tenant user roles.`);
};
