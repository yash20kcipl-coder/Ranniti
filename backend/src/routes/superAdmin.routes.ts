import { Router } from 'express';
import { superAdminAuth } from '../middlewares/superAdminAuth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { optionalUpload } from '../middlewares/upload.middleware';
import { SuperAdminMasterController } from '../controllers/superAdmin/master.controller';
import { superAdminSettingsController } from '../controllers/superAdmin/superAdminSettings.controller';
import { VoterController } from '../controllers/voter.controller';
import {
  voterIdParamSchema,
  createVoterSchema,
  updateVoterSchema,
  voterQuerySchema,
  bulkAssignInfluencerSchema,
  familyCandidatesQuerySchema,
  socialCandidatesQuerySchema,
} from '../schemas/voter.schema';

const router = Router();

// Enforce strict Super Admin isolation on all routes under /api/super-admin
router.use(superAdminAuth);

// Castes
router.get('/castes', SuperAdminMasterController.getCastes);
router.post('/castes', SuperAdminMasterController.createCaste);

// Religions
router.get('/religions', SuperAdminMasterController.getReligions);
router.post('/religions', SuperAdminMasterController.createReligion);

// Parties
router.get('/parties', SuperAdminMasterController.getParties);
router.post('/parties', SuperAdminMasterController.createParty);

// Voters (Super Admin Scoped)
router.get('/voters/stats', VoterController.getVoterStats);
router.get('/voters/export', VoterController.exportVoters);
router.get('/voters/influencer-options', VoterController.getInfluencerOptions);
router.get('/voters/family-candidates', validate(familyCandidatesQuerySchema), VoterController.getFamilyCandidates);
router.get('/voters/social-candidates', validate(socialCandidatesQuerySchema), VoterController.getSocialCandidates);
router.post('/voters/bulk-assign-influencer', validate(bulkAssignInfluencerSchema), VoterController.bulkAssignInfluencer);

router
  .route('/voters')
  .get(validate(voterQuerySchema), VoterController.getVoters)
  .post(optionalUpload('avatar', 'voters'), validate(createVoterSchema), VoterController.createVoter);

router
  .route('/voters/:id')
  .get(validate(voterIdParamSchema), VoterController.getVoterById)
  .put(optionalUpload('avatar', 'voters'), validate(updateVoterSchema), VoterController.updateVoter)
  .delete(validate(voterIdParamSchema), VoterController.deleteVoter);

// Super Admin Settings Endpoints (Master DB)
router
  .route('/settings')
  .get(superAdminSettingsController.getSuperAdminSettings)
  .put(superAdminSettingsController.updateSuperAdminSettings);

router
  .route('/settings/whatsapp/templates')
  .get(superAdminSettingsController.getSuperAdminWhatsAppTemplates)
  .post(superAdminSettingsController.createSuperAdminWhatsAppTemplate);

router.post('/settings/whatsapp/templates/sync', superAdminSettingsController.syncSuperAdminWhatsAppTemplates);

router
  .route('/settings/whatsapp/templates/:id')
  .put(superAdminSettingsController.updateSuperAdminWhatsAppTemplate)
  .delete(superAdminSettingsController.deleteSuperAdminWhatsAppTemplate);

export const superAdminRoutes = router;

