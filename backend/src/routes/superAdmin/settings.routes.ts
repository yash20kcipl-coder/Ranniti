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

export const superAdminSettingsRoutes = router;

