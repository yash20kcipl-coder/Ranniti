import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileBoothController } from '../../controllers/mobile/mobileBooth.controller';

const router = Router();

router.get('/', authenticateMobileUser, mobileBoothController.getAssignedBooths);

export const mobileBoothRoutes = router;
