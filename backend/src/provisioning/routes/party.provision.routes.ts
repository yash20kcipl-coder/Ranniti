import { Router } from 'express';
import { partyProvisionController } from '../controllers/party.provision.controller';

const router = Router({ mergeParams: true });

router.post('/sync', partyProvisionController.sync);
router.get('/stats', partyProvisionController.getStats);

export const partyProvisionRoutes = router;
