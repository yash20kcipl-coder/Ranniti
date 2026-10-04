import { Router } from 'express';
import { tenantDataRoutes } from './data.routes';
import { tenantRoleRoutes } from './role.routes';
import { tenantUserRoutes } from './user.routes';
import { tenantVoterRoutes } from './voter.routes';
import { tenantSettingsRoutes } from './settings.routes';
import { tenantGeographyRoutes } from './geography.routes';
import { tenantVolunteerRoutes } from './volunteer.routes';

const router = Router();

router.use('/data', tenantDataRoutes);
router.use('/roles', tenantRoleRoutes);
router.use('/users', tenantUserRoutes);
router.use('/voters', tenantVoterRoutes);
router.use('/user-roles', tenantRoleRoutes);
router.use('/settings', tenantSettingsRoutes);
router.use('/geography', tenantGeographyRoutes);
router.use('/volunteers', tenantVolunteerRoutes);

// Mount master geography/reference lookup endpoints directly under /tenant/* (e.g., /tenant/castes, /tenant/acs, /tenant/pcs)
router.use(tenantGeographyRoutes);

export const tenantRouter = router;
