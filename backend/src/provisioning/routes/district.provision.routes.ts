import { Router } from 'express';
import { districtProvisionController } from '../controllers/district.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', districtProvisionController.sync);
router.get('/stats', districtProvisionController.getStats);

export const districtProvisionRoutes = router;
