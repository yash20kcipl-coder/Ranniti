import { systemPaths } from './system.docs';
import { superAdminPaths } from './superAdmin.docs';
import { tenantPaths } from './tenant.docs';
import { mobilePaths } from './mobile.docs';
import { provisioningPaths } from './provisioning.docs';

export const swaggerTags = [
  { name: 'System', description: 'System health, sync manifest, app version & uploads' },
  { name: 'Authentication', description: 'User login, registration & profile' },
  { name: 'SuperAdmin - Dashboard', description: 'SuperAdmin KPIs, imports & audit events' },
  { name: 'SuperAdmin - Tenants', description: 'Tenant provisioning, status, sync health & CRUD' },
  { name: 'SuperAdmin - Masters', description: 'States, Districts, ACs, PCs, Booths, Parties, Castes & Religions' },
  { name: 'SuperAdmin - Voters', description: 'Central voter registry & management' },
  { name: 'SuperAdmin - Roles', description: 'Tenant role definitions & permission templates' },
  { name: 'SuperAdmin - Settings', description: 'System-wide campaign & platform configurations' },
  { name: 'SuperAdmin - App Versions', description: 'Mobile app build release & forced update management' },
  { name: 'Tenant - Users', description: 'Tenant admin users, volunteers, leaders & team members' },
  { name: 'Tenant - Voters', description: 'Constituency voter database, search & family mapping' },
  { name: 'Tenant - Elections', description: 'Campaign election configuration & poll day turnout' },
  { name: 'Tenant - Settings', description: 'Tenant-specific campaign settings & WhatsApp templates' },
  { name: 'Tenant - Analytics', description: 'Volunteer performance, surveys & voter coverage' },
  { name: 'Tenant - Bulk Import', description: 'Bulk spreadsheet imports for voters and masters' },
  { name: 'Tenant - Data', description: 'Aggregate constituency metrics and summaries' },
  { name: 'Mobile - Auth', description: 'Mobile volunteer OTP, MPIN & password authentication' },
  { name: 'Mobile - Voters', description: 'Field voter lookup, voter slip, marked as voted' },
  { name: 'Mobile - Booths', description: 'Volunteer assigned booths & polling station info' },
  { name: 'Mobile - Team', description: 'Volunteer team directory & cadre communication' },
  { name: 'Mobile - Dashboard', description: 'Volunteer mobile KPI dashboard & statistics' },
  { name: 'Mobile - Family Mapping', description: 'Head of family and family tree mapping' },
  { name: 'Mobile - Election', description: 'Poll day turnout marking & WhatsApp templates' },
  { name: 'Mobile - Contact Sync', description: 'Phonebook contact matching & outreach interaction logs' },
  { name: 'Mobile - Access', description: 'Granular mobile roles and feature access permissions' },
  { name: 'Provisioning', description: 'Tenant database provisioning & schema migration pipeline' },
];

export const allSwaggerPaths = {
  ...systemPaths,
  ...superAdminPaths,
  ...tenantPaths,
  ...mobilePaths,
  ...provisioningPaths,
};
