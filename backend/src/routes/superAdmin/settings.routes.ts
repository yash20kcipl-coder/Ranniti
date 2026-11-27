import { Router } from 'express';
import { superAdminAuth } from '../../middlewares/superAdminAuth.middleware';
import { superAdminSettingsController } from '../../controllers/superAdmin/superAdminSettings.controller';

const router = Router();

// Enforce Super Admin authentication
router.use(superAdminAuth);

router
  .route('/')
  .get(superAdminSettingsController.getSuperAdminSettings)
  .put(superAdminSettingsController.updateSuperAdminSettings);

// Super Admin exclusive Survey Score Points management
router
  .route('/survey-field-points')
  .get(superAdminSettingsController.getSurveyFieldPoints)
  .put(superAdminSettingsController.updateSurveyFieldPoints);

router
  .route('/survey-field-points/reset')
  .post(superAdminSettingsController.resetSurveyFieldPoints);

export const superAdminSettingsRoutes = router;

