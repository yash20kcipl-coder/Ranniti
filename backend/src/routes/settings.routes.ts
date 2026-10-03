import { Router } from 'express';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

// Secure all settings endpoints with JWT authentication
router.use(authenticateJwt);

// --- CAMPAIGN & SYSTEM SETTINGS ---
router
  .route('/')
  .get(settingsController.getSettings)
  .put(settingsController.updateSettings);

// --- PUSH NOTIFICATION TEST ---
router.post('/push/test', settingsController.testPushNotification);

// --- WHATSAPP TEMPLATES ---
router
  .route('/whatsapp/templates')
  .get(settingsController.getWhatsAppTemplates)
  .post(settingsController.createWhatsAppTemplate);

router.post('/whatsapp/templates/sync', settingsController.syncWhatsAppTemplates);

router
  .route('/whatsapp/templates/:id')
  .put(settingsController.updateWhatsAppTemplate)
  .delete(settingsController.deleteWhatsAppTemplate);

// --- WHATSAPP TEST SEND ---
router.post('/whatsapp/test', settingsController.testWhatsAppMessage);

export const settingsRoutes = router;
