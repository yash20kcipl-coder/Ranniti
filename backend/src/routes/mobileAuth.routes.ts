import { Router } from 'express';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { mobileAuthController } from '../controllers/mobileAuth.controller';

const router = Router();

router.post('/login', mobileAuthController.login);
router.get('/profile', authenticateJwt, mobileAuthController.getProfile);

export const mobileAuthRoutes = router;
