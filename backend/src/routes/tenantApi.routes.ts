import { Router } from 'express';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { tenantApiController } from '../controllers/tenantApi.controller';

const router = Router();

// Protect all tenant routes with JWT authentication
router.use(authenticateJwt);

// --- ASSEMBLY CONSTITUENCIES (ACs) ---
router.route('/acs')
  .get(tenantApiController.getAcs)
  .post(tenantApiController.createAc);

// --- WARDS ---
router.route('/wards')
  .get(tenantApiController.getWards)
  .post(tenantApiController.createWard);

// --- BOOTHS ---
router.route('/booths')
  .get(tenantApiController.getBooths)
  .post(tenantApiController.createBooth);

// --- GEOGRAPHY DATA ---
router.get('/states', tenantApiController.getStates);
router.get('/districts', tenantApiController.getDistricts);

router.route('/talukas')
  .get(tenantApiController.getTalukas)
  .post(tenantApiController.createTaluka);

router.route('/villages')
  .get(tenantApiController.getVillages)
  .post(tenantApiController.createVillage);

// --- REFERENCE MASTER DATA ---
router.get('/religions', tenantApiController.getReligions);

router.route('/castes')
  .get(tenantApiController.getCastes)
  .post(tenantApiController.createCaste);

router.route('/parties')
  .get(tenantApiController.getParties)
  .post(tenantApiController.createParty);

// --- VOTERS ---
router.get('/voters', tenantApiController.getVoters);

export const tenantApiRoutes = router;
