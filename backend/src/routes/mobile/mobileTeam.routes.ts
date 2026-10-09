import { Router } from 'express';
import { onboardTeamMemberSchema } from '../../utils/validators';
import { validate } from '../../middlewares/validate.middleware';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileTeamController } from '../../controllers/mobile/mobileTeam.controller';

const router = Router();

router.get('/', authenticateMobileUser, mobileTeamController.getTeamMembers);
router.post('/', authenticateMobileUser, validate(onboardTeamMemberSchema), mobileTeamController.onboardTeamMember);
router.put('/:id', authenticateMobileUser, mobileTeamController.updateTeamMember);
router.delete('/:id', authenticateMobileUser, mobileTeamController.deleteTeamMember);

export const mobileTeamRoutes = router;

