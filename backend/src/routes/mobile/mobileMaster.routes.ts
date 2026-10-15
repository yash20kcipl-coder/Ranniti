import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileMasterController } from '../../controllers/mobile/mobileMaster.controller';

const router = Router();

router.get('/acs', authenticateMobileUser, mobileMasterController.getAcs);
router.get('/wards', authenticateMobileUser, mobileMasterController.getWards);
router.get('/booths/options', authenticateMobileUser, mobileMasterController.getBoothOptions);
router.get('/parties', authenticateMobileUser, mobileMasterController.getParties);
router.get('/religions', authenticateMobileUser, mobileMasterController.getReligions);
router.get('/castes', authenticateMobileUser, mobileMasterController.getCastes);
router.get('/states', authenticateMobileUser, mobileMasterController.getStates);
router.get('/districts', authenticateMobileUser, mobileMasterController.getDistricts);
router.get('/pcs', authenticateMobileUser, mobileMasterController.getPcs);
router.get('/talukas', authenticateMobileUser, mobileMasterController.getTalukas);
router.get('/villages', authenticateMobileUser, mobileMasterController.getVillages);

export const mobileMasterRoutes = router;
