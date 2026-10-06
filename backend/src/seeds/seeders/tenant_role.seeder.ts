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

  // Seed or ensure standard Tier 1 tenant roles exist
  const existingRoles = await query(`SELECT id, role_name, is_default FROM tenant_roles`);
  let defaultRoleId: string | null = null;

  if (existingRoles.rowCount === 0) {
    logger.info('Seeding default Super Admin Tenant Role Packages...');
    const insertSuite = await query(
      `INSERT INTO tenant_roles (role_name, description, allowed_tabs, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (role_name) DO UPDATE SET is_default = EXCLUDED.is_default
       RETURNING id`,
      [
        'Full Political Campaign Suite',
        'Complete access to all web tabs (incl. settings), tenant master sub-tabs (AC, Ward, Booth), voter directory, and mobile field capabilities.',
        JSON.stringify({
          webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
          masterSubTabs: ['acs', 'wards', 'booths'],
        }),
        true,
        true,
      ]
    );
    defaultRoleId = insertSuite.rows[0]?.id || null;

    await query(
      `INSERT INTO tenant_roles (role_name, description, allowed_tabs, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (role_name) DO NOTHING`,
      [
        'Standard Campaign Package',
        'Access to Dashboard, Voter Directory, Ward & Booth master data, and settings.',
        JSON.stringify({
          webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
          masterSubTabs: ['wards', 'booths'],
        }),
        true,
        false,
      ]
    );

    await query(
      `INSERT INTO tenant_roles (role_name, description, allowed_tabs, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (role_name) DO NOTHING`,
      [
        'Voter Directory & Field Survey Package',
        'Focused package for field operations with Voter Directory and Booth reference access. No settings access.',
        JSON.stringify({
          webTabs: ['dashboard', 'voter_directory'],
          masterSubTabs: ['booths'],
        }),
        true,
        false,
      ]
    );
  } else {
    const defaultRow = existingRoles.rows.find((r: any) => r.is_default);
    if (defaultRow) {
      defaultRoleId = defaultRow.id;
    } else {
      defaultRoleId = existingRoles.rows[0].id;
      await query(`UPDATE tenant_roles SET is_default = true WHERE id = $1`, [defaultRoleId]);
    }
  }

  // Backfill any tenant records in tenants table missing a role assignment
  if (defaultRoleId) {
    const updateRes = await query(
      `UPDATE tenants SET tenant_role_id = $1 WHERE tenant_role_id IS NULL`,
      [defaultRoleId]
    );
    if ((updateRes.rowCount || 0) > 0) {
      logger.info(`Assigned default role package to ${updateRes.rowCount} tenant(s) missing role.`);
    }
  }

  logger.info('✅ Successfully verified and seeded tenant_roles table.');
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
