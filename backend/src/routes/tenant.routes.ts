import { Router } from 'express';
import { tenantAuth } from '../middlewares/tenantAuth.middleware';
import { TenantGeographyController } from '../controllers/tenant/geography.controller';

const router = Router();

// Enforce tenant authorization and pool attachment for all /api/tenant routes
router.use(tenantAuth);

// ACs
router.get('/acs', TenantGeographyController.getAcs);
router.post('/acs', TenantGeographyController.createAc);

// Wards
router.get('/wards', TenantGeographyController.getWards);
router.post('/wards', TenantGeographyController.createWard);

// Booths
router.get('/booths', TenantGeographyController.getBooths);
router.post('/booths', TenantGeographyController.createBooth);

export const tenantRoutes = router;
