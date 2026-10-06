import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { mobileDashboardController } from '../../controllers/mobile/mobileDashboard.controller';

const router = Router();

router.get('/', authenticateJwt, mobileDashboardController.getMetrics);

export const mobileDashboardRoutes = router;
