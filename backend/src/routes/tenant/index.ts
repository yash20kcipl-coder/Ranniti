import { Router } from 'express';
import { syncRoutes } from '../sync.routes';
import { tenantDataRoutes } from './data.routes';
import { tenantRoleRoutes } from './role.routes';
import { tenantUserRoutes } from './user.routes';
import { tenantVoterRoutes } from './voter.routes';
import { tenantElectionRoutes } from './election.routes';
import { tenantSettingsRoutes } from './settings.routes';
import { tenantGeographyRoutes } from './geography.routes';
import { tenantAuth } from '../../middlewares/tenantAuth.middleware';
import { tenantVolunteerAnalyticsRoutes } from './volunteerAnalytics.routes';

const router = Router();

// Apply unified Tenant Authentication and DB Pool attachment to all tenant routes
router.use(tenantAuth);

router.use('/sync', syncRoutes);
router.use('/data', tenantDataRoutes);
router.use('/roles', tenantRoleRoutes);
router.use('/users', tenantUserRoutes);
router.use('/voters', tenantVoterRoutes);
router.use('/user-roles', tenantRoleRoutes);
router.use('/settings', tenantSettingsRoutes);
router.use('/elections', tenantElectionRoutes);
router.use('/geography', tenantGeographyRoutes);
router.use('/analytics', tenantVolunteerAnalyticsRoutes);

// Mount master geography/reference lookup endpoints directly under /tenant/* (e.g., /tenant/castes, /tenant/acs, /tenant/pcs)
router.use(tenantGeographyRoutes);

export const tenantRouter = router;
