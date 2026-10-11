import { Router } from 'express';
import { volunteerAnalyticsController } from '../../controllers/tenant/volunteerAnalytics.controller';

const router = Router();

// Retrieve aggregated volunteer outreach analytics
router.get('/', volunteerAnalyticsController.getVolunteerAnalytics);
router.get('/volunteers', volunteerAnalyticsController.getVolunteerAnalytics);

export const tenantVolunteerAnalyticsRoutes = router;
