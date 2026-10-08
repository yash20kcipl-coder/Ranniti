import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileFamilyMappingController } from '../../controllers/mobile/mobileFamilyMapping.controller';

const router = Router();

router.use(authenticateMobileUser);

router.get('/families', mobileFamilyMappingController.getFamilies);
router.get('/families/:headId', mobileFamilyMappingController.getFamilyMembers);

export const mobileFamilyMappingRoutes = router;
