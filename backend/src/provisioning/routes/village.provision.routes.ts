import { Router } from 'express';
import { villageProvisionController } from '../controllers/village.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', villageProvisionController.sync);
router.get('/stats', villageProvisionController.getStats);

export const villageProvisionRoutes = router;
