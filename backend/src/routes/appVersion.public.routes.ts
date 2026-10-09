import { Router } from 'express';
import { appVersionController } from '../controllers/appVersion.controller';

const router = Router();

// Public endpoint accessed by mobile app during version check (no auth required)
router.get('/', appVersionController.getPublicAppVersions);

export const publicAppVersionRoutes = router;
