import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { tenantApiController } from '../../controllers/tenant/tenantApi.controller';

const router = Router();

// Protect all tenant geography routes with JWT
router.use(authenticateJwt);

// --- ASSEMBLY CONSTITUENCIES (ACs) ---
router.route('/acs')
  .get(tenantApiController.getAcs)
  .post(tenantApiController.createAc);

router.route('/acs/:id')
  .put(tenantApiController.updateAc)
  .delete(tenantApiController.deleteAc);

// --- WARDS ---
router.route('/wards')
  .get(tenantApiController.getWards)
  .post(tenantApiController.createWard);

router.route('/wards/:id')
  .put(tenantApiController.updateWard)
  .delete(tenantApiController.deleteWard);

// --- BOOTHS ---
router.route('/booths/options')
  .get(tenantApiController.getBoothOptions);

router.route('/booths')
  .get(tenantApiController.getBooths)
  .post(tenantApiController.createBooth);

router.route('/booths/:id')
  .put(tenantApiController.updateBooth)
  .delete(tenantApiController.deleteBooth);

// --- GEOGRAPHY DATA ---
router.get('/states', tenantApiController.getStates);
router.get('/pcs', tenantApiController.getPcs);
router.get('/districts', tenantApiController.getDistricts);

router.route('/talukas')
  .get(tenantApiController.getTalukas)
  .post(tenantApiController.createTaluka);

router.route('/talukas/:id')
  .put(tenantApiController.updateTaluka)
  .delete(tenantApiController.deleteTaluka);

router.route('/villages')
  .get(tenantApiController.getVillages)
  .post(tenantApiController.createVillage);

router.route('/villages/:id')
  .put(tenantApiController.updateVillage)
  .delete(tenantApiController.deleteVillage);

// --- REFERENCE MASTER DATA ---
router.get('/religions', tenantApiController.getReligions);

router.route('/castes')
  .get(tenantApiController.getCastes)
  .post(tenantApiController.createCaste);

router.route('/castes/:id')
  .put(tenantApiController.updateCaste)
  .delete(tenantApiController.deleteCaste);

router.route('/parties')
  .get(tenantApiController.getParties)
  .post(tenantApiController.createParty);

router.route('/profession-categories')
  .get(tenantApiController.getProfessionCategories)
  .post(tenantApiController.createProfessionCategory);

router.route('/profession-categories/:id')
  .put(tenantApiController.updateProfessionCategory)
  .delete(tenantApiController.deleteProfessionCategory);

router.route('/professions')
  .get(tenantApiController.getProfessions)
  .post(tenantApiController.createProfession);

router.route('/professions/:id')
  .put(tenantApiController.updateProfession)
  .delete(tenantApiController.deleteProfession);

export const tenantGeographyRoutes = router;
