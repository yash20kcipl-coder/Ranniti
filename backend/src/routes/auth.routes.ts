import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { loginSchema, registerUserSchema, changePasswordSchema } from '../schemas/auth.schema';

const router = Router();

// Public Auth Endpoints
router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerUserSchema), authController.register);

// Protected Profile & Password Management Endpoints
router.get('/me', authenticateJwt, authController.getProfile);
router.post('/change-password', authenticateJwt, validate(changePasswordSchema), authController.changePassword);

export const authRoutes = router;

