import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileElectionController } from '../../controllers/mobile/mobileElection.controller';

const router = Router();

router.use(authenticateMobileUser);

router.get('/voters', mobileElectionController.getVoters);
router.post('/mark-voted', mobileElectionController.markVoted);
router.post('/batch-sync', mobileElectionController.batchSync);
router.get('/booth-turnout', mobileElectionController.getBoothTurnout);
router.get('/whatsapp-templates', mobileElectionController.getWhatsAppTemplates);

export const mobileElectionRoutes = router;
