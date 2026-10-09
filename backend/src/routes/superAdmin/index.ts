import { Router } from 'express';
import { superAdminRoleRoutes } from './role.routes';
import { superAdminVoterRoutes } from './voter.routes';
import { superAdminMasterRoutes } from './master.routes';
import { superAdminTenantRoutes } from './tenant.routes';
import { superAdminSettingsRoutes } from './settings.routes';
import { superAdminDashboardRoutes } from './dashboard.routes';
import { superAdminAppVersionRoutes } from './appVersion.routes';
import { superAdminAuth } from '../../middlewares/superAdminAuth.middleware';
import { provisioningRoutes } from '../../provisioning/routes/provisioning.routes';

const router = Router();

// Strictly enforce Super Admin authentication & privilege on all /super-admin/* routes
// Blocks all tenant users (tenant_admin, leader, sub_leader, volunteer, etc.) with 403 Forbidden
router.use(superAdminAuth);

router.use('/voters', superAdminVoterRoutes);
router.use('/tenants', superAdminTenantRoutes);
router.use('/masters', superAdminMasterRoutes);
router.use('/provisioning', provisioningRoutes);
router.use('/tenant-roles', superAdminRoleRoutes);
router.use('/settings', superAdminSettingsRoutes);
router.use('/dashboard', superAdminDashboardRoutes);
router.use('/app-versions', superAdminAppVersionRoutes);

export const superAdminRouter = router;
