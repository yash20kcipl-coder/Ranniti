import { Router } from 'express';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { syncManifestController } from '../controllers/syncManifest.controller';

const router = Router();

// Allow authenticated users (Web / Mobile) to fetch sync manifest and bootstrap cached datasets
router.post('/manifest', authenticateJwt, syncManifestController.getSyncManifest);
router.post('/bootstrap', authenticateJwt, syncManifestController.bootstrapSync);

export const syncRoutes = router;
