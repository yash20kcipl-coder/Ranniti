import { Router } from 'express';
import { superAdminAuth } from '../middlewares/superAdminAuth.middleware';
import { SuperAdminMasterController } from '../controllers/superAdmin/master.controller';

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

export const superAdminRoutes = router;
