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

// Tenant-isolated WhatsApp message templates
router
  .route('/whatsapp/templates')
  .get(tenantSettingsController.getTenantWhatsAppTemplates)
  .post(tenantSettingsController.createTenantWhatsAppTemplate);

router
  .route('/whatsapp/templates/sync')
  .post(tenantSettingsController.syncTenantWhatsAppTemplates);

router
  .route('/whatsapp/templates/:id')
  .get(tenantSettingsController.getTenantWhatsAppTemplateById)
  .put(tenantSettingsController.updateTenantWhatsAppTemplate)
  .delete(tenantSettingsController.deleteTenantWhatsAppTemplate);

// Read-only Survey Field Points for tenant reference (rules managed strictly by Super Admin)
router
  .route('/survey-field-points')
  .get(tenantSettingsController.getSurveyFieldPoints);

export const tenantSettingsRoutes = router;
