import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileVoterController } from '../../controllers/mobile/mobileVoter.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  bulkAssignInfluencerSchema,
  familyCandidatesQuerySchema,
  socialCandidatesQuerySchema,
} from '../../schemas/voter.schema';

const router = Router();

router.use(authenticateMobileUser);

router.get('/', mobileVoterController.getVoters);
router.post('/', mobileVoterController.createVoter);
router.get('/influencer-options', mobileVoterController.getInfluencerOptions);
router.get('/family-candidates', validate(familyCandidatesQuerySchema), mobileVoterController.getFamilyCandidates);
router.get('/social-candidates', validate(socialCandidatesQuerySchema), mobileVoterController.getSocialCandidates);
router.post('/bulk-assign-influencer', validate(bulkAssignInfluencerSchema), mobileVoterController.bulkAssignInfluencer);
router.put('/:id', mobileVoterController.updateVoter);
router.get('/:id', mobileVoterController.getVoterById);

export const mobileVoterRoutes = router;
