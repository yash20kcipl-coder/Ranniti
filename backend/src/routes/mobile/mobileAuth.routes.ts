import { Router } from 'express';
import { mobileAuthController } from '../../controllers/mobileAuth.controller';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';

const router = Router();

router.post('/login', mobileAuthController.login);
router.get('/profile', authenticateMobileUser, mobileAuthController.getProfile);
router.put('/profile', authenticateMobileUser, mobileAuthController.updateProfile);

export const mobileAuthRoutes = router;

