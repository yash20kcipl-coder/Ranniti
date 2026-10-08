import { Router } from 'express';
import { acProvisionController } from '../controllers/ac.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', acProvisionController.sync);
router.get('/stats', acProvisionController.getStats);

export const acProvisionRoutes = router;
