import { Router } from 'express';
import { tenantElectionController } from '../../controllers/tenant/tenantElection.controller';

const router = Router();

// --- READ-ONLY & OPERATIONAL ROUTES (Tenant Access Permitted) ---
router.get('/', tenantElectionController.getElections);
router.get('/default', tenantElectionController.getDefaultElection);
router.post('/sync-default', tenantElectionController.syncDefaultElection);
router.get('/:id', tenantElectionController.getElectionById);

// --- TENANT CAMPAIGN OPERATIONS (Set Active Election, Polling Day) ---
router.patch('/:id/set-default', tenantElectionController.setDefaultElection);
router.post('/:id/voter-status', tenantElectionController.recordVoterStatus);
router.post('/:id/voter-status/batch', tenantElectionController.batchSyncVoterStatus);
router.get('/:id/turnout', tenantElectionController.getBoothTurnout);
router.get('/:id/analytics/hourly', tenantElectionController.getHourlyTurnoutAnalytics);

// --- SUPER ADMIN ONLY: Create / Update / Delete are NOT exposed on tenant routes ---
// Elections must be created and assigned by Super Admin via /api/v1/super-admin/elections

export const tenantElectionRoutes = router;
