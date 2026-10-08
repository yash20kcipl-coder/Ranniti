import { Router } from 'express';
import { stateProvisionController } from '../controllers/state.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', stateProvisionController.sync);
router.get('/stats', stateProvisionController.getStats);

export const stateProvisionRoutes = router;
