import { Router } from 'express';
import { mobileTeamRoutes } from './mobileTeam.routes';
import { mobileAuthRoutes } from './mobileAuth.routes';
import { mobileVoterRoutes } from './mobileVoter.routes';
import { mobileBoothRoutes } from './mobileBooth.routes';
import { mobileAccessRoutes } from './mobileAccess.routes';
import { mobileDashboardRoutes } from './mobileDashboard.routes';
import { mobileContactSyncRoutes } from './mobileContactSync.routes';
import { mobileFamilyMappingRoutes } from './mobileFamilyMapping.routes';

const router = Router();

router.use('/auth', mobileAuthRoutes);
router.use('/team', mobileTeamRoutes);
router.use('/booths', mobileBoothRoutes);
router.use('/voters', mobileVoterRoutes);
router.use('/voters', mobileContactSyncRoutes);
router.use('/dashboard', mobileDashboardRoutes);
router.use('/family-mapping', mobileFamilyMappingRoutes);
router.use('/', mobileAccessRoutes);

export const mobileRouter = router;

