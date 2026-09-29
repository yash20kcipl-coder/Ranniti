import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { optionalUpload } from '../middlewares/upload.middleware';
import {
  voterIdParamSchema,
  createVoterSchema,
  updateVoterSchema,
  voterQuerySchema,
  bulkAssignInfluencerSchema,
  familyCandidatesQuerySchema,
  socialCandidatesQuerySchema,
} from '../schemas/voter.schema';
import { VoterController } from '../controllers/voter.controller';

const router = Router();

// Stats, Export, Influencer options & Candidate endpoints
router.get('/stats', VoterController.getVoterStats);
router.get('/export', VoterController.exportVoters);
router.get('/influencer-options', VoterController.getInfluencerOptions);
router.get('/family-candidates', validate(familyCandidatesQuerySchema), VoterController.getFamilyCandidates);
router.get('/social-candidates', validate(socialCandidatesQuerySchema), VoterController.getSocialCandidates);
router.post('/bulk-assign-influencer', validate(bulkAssignInfluencerSchema), VoterController.bulkAssignInfluencer);

// CRUD routes - Supports both JSON and multipart/form-data with file upload
router
  .route('/')
  .get(validate(voterQuerySchema), VoterController.getVoters)
  .post(optionalUpload('avatar', 'voters'), validate(createVoterSchema), VoterController.createVoter);

router
  .route('/:id')
  .get(validate(voterIdParamSchema), VoterController.getVoterById)
  .put(optionalUpload('avatar', 'voters'), validate(updateVoterSchema), VoterController.updateVoter)
  .delete(validate(voterIdParamSchema), VoterController.deleteVoter);

export const voterRoutes = router;
