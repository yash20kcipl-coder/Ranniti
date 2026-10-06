import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { mobileAuthController } from '../../controllers/mobileAuth.controller';
import { mobileAccessController } from '../../controllers/mobile/mobileAccess.controller';

const router = Router();

router.post('/login', mobileAuthController.login);
router.get('/profile', authenticateJwt, mobileAuthController.getProfile);
router.put('/profile', authenticateJwt, mobileAuthController.updateProfile);
router.get('/roles', authenticateJwt, mobileAccessController.getAvailableRoles);
router.get('/role-access', authenticateJwt, mobileAccessController.getRoleAccess);

export const mobileAuthRoutes = router;
