import { Router } from 'express';
import { SurveyScoringController } from '../../controllers/tenant/surveyScoring.controller';

const router = Router();

// Leaderboard and aggregates
router.get('/leaderboard', SurveyScoringController.getLeaderboard);

// Export leaderboard as .xlsx per Rule 22
router.get('/export', SurveyScoringController.exportLeaderboard);

// Recent field update audit feed
router.get('/audit-feed', SurveyScoringController.getAuditFeed);

// Single volunteer breakdown
router.get('/volunteers/:volunteerId', SurveyScoringController.getVolunteerStats);

export const tenantSurveyScoringRoutes = router;
