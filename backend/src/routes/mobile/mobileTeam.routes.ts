import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { mobileTeamController } from '../../controllers/mobile/mobileTeam.controller';

const router = Router();

router.post('/', authenticateJwt, mobileTeamController.onboardTeamMember);
router.get('/', authenticateJwt, mobileTeamController.getTeamMembers);

export const mobileTeamRoutes = router;
