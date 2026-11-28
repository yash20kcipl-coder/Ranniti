import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileDashboardController } from '../../controllers/mobile/mobileDashboard.controller';

const router = Router();

router.get('/', authenticateMobileUser, mobileDashboardController.getMetrics);
router.get('/survey-score', authenticateMobileUser, mobileDashboardController.getSurveyScore);

export const mobileDashboardRoutes = router;
