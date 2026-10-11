import { Router } from 'express';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { syncManifestController } from '../controllers/syncManifest.controller';

const router = Router();

// Allow authenticated users (Web / Mobile) to fetch sync manifest
router.post('/manifest', authenticateJwt, syncManifestController.getSyncManifest);

export const syncRoutes = router;
