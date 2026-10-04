import { Router } from 'express';
import { authenticateJwt, requireAdmin } from '../../middlewares/auth.middleware';
import { tenantDataController } from '../../controllers/tenant/tenantData.controller';

const router = Router();

// Require JWT authentication and Admin/Tenant Admin role
router.use(authenticateJwt, requireAdmin);

router.get('/stats', tenantDataController.getStats);
router.get('/booths', tenantDataController.getBooths);
router.get('/profile', tenantDataController.getProfile);
router.get('/constituencies', tenantDataController.getConstituencies);

export const tenantDataRoutes = router;
