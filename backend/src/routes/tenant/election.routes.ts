import { Router } from 'express';
import { tenantElectionController } from '../../controllers/tenant/tenantElection.controller';

const router = Router();

router.get('/', tenantElectionController.getElections);
router.get('/default', tenantElectionController.getDefaultElection);
router.post('/sync-default', tenantElectionController.syncDefaultElection);
router.get('/:id', tenantElectionController.getElectionById);
router.post('/', tenantElectionController.createElection);
router.put('/:id', tenantElectionController.updateElection);
router.patch('/:id/set-default', tenantElectionController.setDefaultElection);
router.delete('/:id', tenantElectionController.deleteElection);
router.post('/:id/voter-status', tenantElectionController.recordVoterStatus);
router.post('/:id/voter-status/batch', tenantElectionController.batchSyncVoterStatus);
router.get('/:id/turnout', tenantElectionController.getBoothTurnout);
router.get('/:id/analytics/hourly', tenantElectionController.getHourlyTurnoutAnalytics);

export const tenantElectionRoutes = router;
