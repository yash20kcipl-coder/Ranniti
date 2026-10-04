import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { optionalUpload } from '../../middlewares/upload.middleware';
import {
  voterIdParamSchema,
  createVoterSchema,
  updateVoterSchema,
  voterQuerySchema,
  bulkAssignInfluencerSchema,
  familyCandidatesQuerySchema,
  socialCandidatesQuerySchema,
} from '../../schemas/voter.schema';
import { VoterController } from '../../controllers/tenant/voter.controller';
import { FamilyMappingController } from '../../controllers/tenant/familyMapping.controller';

const router = Router();

// Protect all tenant voter routes with JWT authentication
router.use(authenticateJwt);

// Stats, Export, Influencer options & Candidate endpoints
router.get('/stats', VoterController.getVoterStats);
router.get('/export', VoterController.exportVoters);
router.get('/influencer-options', VoterController.getInfluencerOptions);
router.get('/family-candidates', validate(familyCandidatesQuerySchema), VoterController.getFamilyCandidates);
router.get('/social-candidates', validate(socialCandidatesQuerySchema), VoterController.getSocialCandidates);
router.post('/bulk-assign-influencer', validate(bulkAssignInfluencerSchema), VoterController.bulkAssignInfluencer);

// Family Mapping & Household Intelligence endpoints
router.post('/family-mapping/auto-group', FamilyMappingController.autoMapFamilies);
router.get('/family-mapping/families', FamilyMappingController.getFamilies);
router.get('/family-mapping/families/:headId', FamilyMappingController.getFamilyMembers);
router.post('/family-mapping/set-head', FamilyMappingController.setNewFamilyHead);

// CRUD routes
router
  .route('/')
  .get(validate(voterQuerySchema), VoterController.getVoters)
  .post(optionalUpload('avatar', 'voters'), validate(createVoterSchema), VoterController.createVoter);

router
  .route('/:id')
  .get(validate(voterIdParamSchema), VoterController.getVoterById)
  .put(optionalUpload('avatar', 'voters'), validate(updateVoterSchema), VoterController.updateVoter)
  .delete(validate(voterIdParamSchema), VoterController.deleteVoter);

export const tenantVoterRoutes = router;
