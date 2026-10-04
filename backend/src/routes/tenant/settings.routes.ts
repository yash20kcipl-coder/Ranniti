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

router
  .route('/whatsapp/templates')
  .get(tenantSettingsController.getTenantWhatsAppTemplates)
  .post(tenantSettingsController.createTenantWhatsAppTemplate);

router.post('/whatsapp/templates/sync', tenantSettingsController.syncTenantWhatsAppTemplates);

router
  .route('/whatsapp/templates/:id')
  .put(tenantSettingsController.updateTenantWhatsAppTemplate)
  .delete(tenantSettingsController.deleteTenantWhatsAppTemplate);

export const tenantSettingsRoutes = router;
