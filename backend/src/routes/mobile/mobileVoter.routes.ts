import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileVoterController } from '../../controllers/mobile/mobileVoter.controller';

const router = Router();

router.get('/', authenticateMobileUser, mobileVoterController.getVoters);
router.put('/:id', authenticateMobileUser, mobileVoterController.updateVoter);

export const mobileVoterRoutes = router;
