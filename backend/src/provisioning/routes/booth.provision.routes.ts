import { Router } from 'express';
import { boothProvisionController } from '../controllers/booth.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', boothProvisionController.sync);
router.get('/stats', boothProvisionController.getStats);

export const boothProvisionRoutes = router;
