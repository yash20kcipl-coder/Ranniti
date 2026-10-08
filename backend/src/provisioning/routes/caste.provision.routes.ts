import { Router } from 'express';
import { casteProvisionController } from '../controllers/caste.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', casteProvisionController.sync);
router.get('/stats', casteProvisionController.getStats);

export const casteProvisionRoutes = router;
