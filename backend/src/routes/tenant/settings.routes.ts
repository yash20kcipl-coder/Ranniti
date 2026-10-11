import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { tenantSettingsController } from '../../controllers/tenant/tenantSettings.controller';

const router = Router();

// Protect all tenant settings routes with JWT
router.use(authenticateJwt);

router
  .route('/')
  .get(tenantSettingsController.getTenantSettings)
  .put(tenantSettingsController.updateTenantSettings);

export const tenantSettingsRoutes = router;
