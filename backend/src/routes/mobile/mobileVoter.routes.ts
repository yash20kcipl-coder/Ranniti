import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { mobileVoterController } from '../../controllers/mobile/mobileVoter.controller';

const router = Router();

router.get('/', authenticateJwt, mobileVoterController.getVoters);
router.put('/:id', authenticateJwt, mobileVoterController.updateVoter);

export const mobileVoterRoutes = router;
