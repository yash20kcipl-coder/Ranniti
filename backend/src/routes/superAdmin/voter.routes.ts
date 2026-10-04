import { Router } from 'express';
import {
  voterIdParamSchema,
  createVoterSchema,
  updateVoterSchema,
  voterQuerySchema,
  bulkAssignInfluencerSchema,
  familyCandidatesQuerySchema,
  socialCandidatesQuerySchema,
} from '../../schemas/voter.schema';
import { validate } from '../../middlewares/validate.middleware';
import { optionalUpload } from '../../middlewares/upload.middleware';
import { VoterController } from '../../controllers/tenant/voter.controller';
import { superAdminAuth } from '../../middlewares/superAdminAuth.middleware';

const router = Router();

// Enforce strict Super Admin isolation on all routes
router.use(superAdminAuth);

router.get('/stats', VoterController.getVoterStats);
router.get('/export', VoterController.exportVoters);
router.get('/influencer-options', VoterController.getInfluencerOptions);
router.get('/family-candidates', validate(familyCandidatesQuerySchema), VoterController.getFamilyCandidates);
router.get('/social-candidates', validate(socialCandidatesQuerySchema), VoterController.getSocialCandidates);
router.post('/bulk-assign-influencer', validate(bulkAssignInfluencerSchema), VoterController.bulkAssignInfluencer);

router
  .route('/')
  .get(validate(voterQuerySchema), VoterController.getVoters)
  .post(optionalUpload('avatar', 'voters'), validate(createVoterSchema), VoterController.createVoter);

router
  .route('/:id')
  .get(validate(voterIdParamSchema), VoterController.getVoterById)
  .put(optionalUpload('avatar', 'voters'), validate(updateVoterSchema), VoterController.updateVoter)
  .delete(validate(voterIdParamSchema), VoterController.deleteVoter);

export const superAdminVoterRoutes = router;
