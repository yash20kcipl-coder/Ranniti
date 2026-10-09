import { Router } from 'express';
import { mobileAuthController } from '../../controllers/mobileAuth.controller';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';

const router = Router();

router.post('/login', mobileAuthController.login);
router.post('/send-otp', mobileAuthController.sendOtp);
router.post('/verify-otp', mobileAuthController.verifyOtp);
router.post('/verify-mpin', mobileAuthController.verifyMpin);
router.get('/profile', authenticateMobileUser, mobileAuthController.getProfile);
router.post('/setup-mpin', authenticateMobileUser, mobileAuthController.setupMpin);
router.put('/profile', authenticateMobileUser, mobileAuthController.updateProfile);

export const mobileAuthRoutes = router;


