import { Router } from 'express';
import { superAdminElectionController } from '../../controllers/superAdmin/election.controller';

const router = Router();

router.get('/options', superAdminElectionController.getElectionOptions);

router
  .route('/')
  .get(superAdminElectionController.getElections)
  .post(superAdminElectionController.createElection);

router
  .route('/:id')
  .get(superAdminElectionController.getElectionById)
  .put(superAdminElectionController.updateElection)
  .delete(superAdminElectionController.deleteElection);

router.post('/:id/assign', superAdminElectionController.assignToTenants);
router.post('/:id/unassign', superAdminElectionController.unassignTenant);

export const superAdminElectionRoutes = router;
