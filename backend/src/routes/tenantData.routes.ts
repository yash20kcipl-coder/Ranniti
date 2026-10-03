import { Router } from 'express';
import { tenantDataController } from '../controllers/tenantData.controller';
import { authenticateJwt, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Require JWT authentication and Admin/Tenant Admin role for all tenant-data endpoints
router.use(authenticateJwt, requireAdmin);

router.get('/stats', tenantDataController.getStats);
router.get('/booths', tenantDataController.getBooths);
router.get('/profile', tenantDataController.getProfile);
router.get('/constituencies', tenantDataController.getConstituencies);

export const tenantDataRoutes = router;
