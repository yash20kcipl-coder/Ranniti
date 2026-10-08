import { Router } from 'express';
import { talukaProvisionController } from '../controllers/taluka.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', talukaProvisionController.sync);
router.get('/stats', talukaProvisionController.getStats);

export const talukaProvisionRoutes = router;
