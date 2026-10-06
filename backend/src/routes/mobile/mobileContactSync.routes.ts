import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { mobileContactSyncController } from '../../controllers/mobile/mobileContactSync.controller';

const router = Router();

router.post('/sync-contacts', authenticateJwt, mobileContactSyncController.syncContacts);

export const mobileContactSyncRoutes = router;
