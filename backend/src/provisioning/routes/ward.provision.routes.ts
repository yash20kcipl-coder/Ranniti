import { Router } from 'express';
import { wardProvisionController } from '../controllers/ward.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', wardProvisionController.sync);
router.get('/stats', wardProvisionController.getStats);

export const wardProvisionRoutes = router;
