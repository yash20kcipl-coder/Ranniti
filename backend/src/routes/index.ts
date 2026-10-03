import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { voterRoutes } from './voter.routes';
import { healthRoutes } from './health.routes';
import { masterRoutes } from './master.routes';
import { uploadRoutes } from './upload.routes';
import { tenantRoutes } from './tenant.routes';
import { settingsRoutes } from './settings.routes';
import { tenantApiRoutes } from './tenantApi.routes';
import { volunteerRoutes } from './volunteer.routes';
import { adminUserRoutes } from './admin_user.routes';
import { mobileAuthRoutes } from './mobileAuth.routes';
import { tenantDataRoutes } from './tenantData.routes';
import superAdminRoleRoutes from './superAdminRole.routes';
import tenantUserRoleRoutes from './tenantUserRole.routes';
import { superAdminTenantRoutes } from './superAdminTenant.routes';
import { superAdminRoutes } from './superAdmin.routes';

const router = Router();
// Health routes
router.use('/health', healthRoutes);
// Authentication routes
router.use('/auth', authRoutes);
router.use('/mobile/auth', mobileAuthRoutes);
// 3-Tier API Security Architecture Routes
router.use('/super-admin', superAdminRoutes);
router.use('/tenant', tenantRoutes);
router.use('/volunteer', volunteerRoutes);
// Dedicated Tenant API Scoped Routes (ACs, Wards, Booths, Geography, Masters, Voters)
router.use('/tenant-api', tenantApiRoutes);
// Super Admin Dedicated Sub-Routes
router.use('/super-admin/tenants', superAdminTenantRoutes);
router.use('/super-admin/tenant-roles', superAdminRoleRoutes);
// Tenant User Custom Roles & Field Permissions
router.use('/tenant/user-roles', tenantUserRoleRoutes);
// Dedicated Tenant Campaign Data Routes
router.use('/tenant-data', tenantDataRoutes);
// Volunteer Onboarding & Booth Assignment Legacy
router.use('/volunteers', volunteerRoutes);
// Master data routes
router.use('/masters', masterRoutes);
// Admin user routes
router.use('/admin-users', adminUserRoutes);
// Tenant user routes
router.use('/tenants', tenantRoutes);
// Voter routes
router.use('/voters', voterRoutes);
// Upload routes
router.use('/uploads', uploadRoutes);
// Settings routes
router.use('/settings', settingsRoutes);

export const apiRouter = router;




