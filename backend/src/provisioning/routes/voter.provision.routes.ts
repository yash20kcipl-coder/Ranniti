import { Router } from 'express';
import { voterProvisionController } from '../controllers/voter.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', voterProvisionController.sync);
router.get('/stats', voterProvisionController.getStats);

export const voterProvisionRoutes = router;
