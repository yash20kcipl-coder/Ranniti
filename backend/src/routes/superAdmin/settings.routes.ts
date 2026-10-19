import { Router } from 'express';
import { superAdminAuth } from '../../middlewares/superAdminAuth.middleware';
import { superAdminSettingsController } from '../../controllers/superAdmin/superAdminSettings.controller';

const router = Router();

// Enforce Super Admin authentication
router.use(superAdminAuth);

router
  .route('/')
  .get(superAdminSettingsController.getSuperAdminSettings)
  .put(superAdminSettingsController.updateSuperAdminSettings);

// Normal Message Templates (No external API or 11za gateway needed)
router
  .route('/whatsapp/templates')
  .get(superAdminSettingsController.getSuperAdminWhatsAppTemplates)
  .post(superAdminSettingsController.createSuperAdminWhatsAppTemplate);

router
  .route('/whatsapp/templates/:id')
  .put(superAdminSettingsController.updateSuperAdminWhatsAppTemplate)
  .delete(superAdminSettingsController.deleteSuperAdminWhatsAppTemplate);

export const superAdminSettingsRoutes = router;

