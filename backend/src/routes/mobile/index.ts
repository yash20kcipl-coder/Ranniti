import { Router } from 'express';
import { mobileTeamRoutes } from './mobileTeam.routes';
import { mobileAuthRoutes } from './mobileAuth.routes';
import { mobileVoterRoutes } from './mobileVoter.routes';
import { mobileDashboardRoutes } from './mobileDashboard.routes';
import { mobileContactSyncRoutes } from './mobileContactSync.routes';

const router = Router();

router.use('/auth', mobileAuthRoutes);
router.use('/dashboard', mobileDashboardRoutes);
router.use('/voters', mobileContactSyncRoutes);
router.use('/voters', mobileVoterRoutes);
router.use('/team', mobileTeamRoutes);
// Alias endpoint for get role access directly under /mobile/role-access
router.use('/', mobileAuthRoutes);

export const mobileRouter = router;
