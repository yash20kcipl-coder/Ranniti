import { Router } from 'express';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { tenantApiController } from '../controllers/tenantApi.controller';
import { tenantSettingsController } from '../controllers/tenant/tenantSettings.controller';

const router = Router();

// Protect all tenant routes with JWT authentication
router.use(authenticateJwt);

// --- SETTINGS (TENANT DB) ---
router
  .route('/settings')
  .get(tenantSettingsController.getTenantSettings)
  .put(tenantSettingsController.updateTenantSettings);

router
  .route('/settings/whatsapp/templates')
  .get(tenantSettingsController.getTenantWhatsAppTemplates)
  .post(tenantSettingsController.createTenantWhatsAppTemplate);

router.post('/settings/whatsapp/templates/sync', tenantSettingsController.syncTenantWhatsAppTemplates);

router
  .route('/settings/whatsapp/templates/:id')
  .put(tenantSettingsController.updateTenantWhatsAppTemplate)
  .delete(tenantSettingsController.deleteTenantWhatsAppTemplate);

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
router.route('/booths')
  .get(tenantApiController.getBooths)
  .post(tenantApiController.createBooth);

router.route('/booths/:id')
  .put(tenantApiController.updateBooth)
  .delete(tenantApiController.deleteBooth);

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
