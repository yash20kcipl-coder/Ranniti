import { Router } from 'express';
import { superAdminAuth } from '../../middlewares/superAdminAuth.middleware';
import { superAdminAppVersionController } from '../../controllers/superAdmin/appVersion.controller';

const router = Router();

// Enforce Super Admin authentication
router.use(superAdminAuth);

router
  .route('/')
  .get(superAdminAppVersionController.getAppVersions);

router
  .route('/:id')
  .put(superAdminAppVersionController.updateAppVersion);

export const superAdminAppVersionRoutes = router;
