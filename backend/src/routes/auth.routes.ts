import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { loginSchema, registerUserSchema, changePasswordSchema } from '../schemas/auth.schema';

const router = Router();

// Public Auth Endpoints

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate user & get JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *           examples:
 *             TenantAdmin:
 *               summary: Tenant Admin (Divyesh)
 *               value:
 *                 email: "divyesh.chavada@gmail.com"
 *                 password: "Divyesh@1750"
 *             SuperAdmin:
 *               summary: Super Admin
 *               value:
 *                 email: "superadmin@ranniti.com"
 *                 password: "SuperAdmin@123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Yash Sharma"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 example: "yash@example.com"
 *               password:
 *                 type: string
 *                 example: "SecretPassword123!"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: User already exists
 */
router.post('/register', validate(registerUserSchema), authController.register);

// Protected Profile & Password Management Endpoints

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get currently authenticated user profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized / Missing or expired token
 */
router.get('/me', authenticateJwt, authController.getProfile);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid old password or validation failure
 */
router.post('/change-password', authenticateJwt, validate(changePasswordSchema), authController.changePassword);

export const authRoutes = router;

