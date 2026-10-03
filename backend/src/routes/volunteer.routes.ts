import { Router } from 'express';
import { volunteerAuth } from '../middlewares/volunteerAuth.middleware';
import { VolunteerSurveyController } from '../controllers/volunteer/survey.controller';

const router = Router();

// Enforce volunteer auth and booth scoping on all /api/volunteer routes
router.use(volunteerAuth);

// Assigned Booths
router.get('/assigned-booths', VolunteerSurveyController.getAssignedBooths);

// Scoped Voters
router.get('/voters', VolunteerSurveyController.getScopedVoters);

// Survey Updates
router.put('/voters/:voterId/survey', VolunteerSurveyController.updateVoterSurvey);

export const volunteerRoutes = router;
