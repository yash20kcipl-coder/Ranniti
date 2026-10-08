import { Router } from 'express';
import { pcProvisionController } from '../controllers/pc.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', pcProvisionController.sync);
router.get('/stats', pcProvisionController.getStats);

export const pcProvisionRoutes = router;
