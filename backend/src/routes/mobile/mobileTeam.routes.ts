import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileTeamController } from '../../controllers/mobile/mobileTeam.controller';

const router = Router();

router.get('/', authenticateMobileUser, mobileTeamController.getTeamMembers);
router.post('/', authenticateMobileUser, mobileTeamController.onboardTeamMember);
router.put('/:id', authenticateMobileUser, mobileTeamController.updateTeamMember);
router.delete('/:id', authenticateMobileUser, mobileTeamController.deleteTeamMember);

export const mobileTeamRoutes = router;

