import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileVoterController } from '../../controllers/mobile/mobileVoter.controller';

const router = Router();

router.get('/', authenticateMobileUser, mobileVoterController.getVoters);
router.post('/', authenticateMobileUser, mobileVoterController.createVoter);
router.put('/:id', authenticateMobileUser, mobileVoterController.updateVoter);
router.get('/:id', authenticateMobileUser, mobileVoterController.getVoterById);
router.get('/influencer-options', authenticateMobileUser, mobileVoterController.getInfluencerOptions);

export const mobileVoterRoutes = router;
