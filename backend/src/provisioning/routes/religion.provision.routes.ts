import { Router } from 'express';
import { religionProvisionController } from '../controllers/religion.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', religionProvisionController.sync);
router.get('/stats', religionProvisionController.getStats);

export const religionProvisionRoutes = router;
