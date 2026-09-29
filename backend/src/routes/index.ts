import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { voterRoutes } from './voter.routes';
import { healthRoutes } from './health.routes';
import { masterRoutes } from './master.routes';
import { uploadRoutes } from './upload.routes';
import { adminUserRoutes } from './admin_user.routes';

const router = Router();
// Health routes
router.use('/health', healthRoutes);
// Authentication routes
router.use('/auth', authRoutes);
// Master data routes
router.use('/masters', masterRoutes);
// Admin user routes
router.use('/users', adminUserRoutes);
router.use('/admin-users', adminUserRoutes);
// Voter routes
router.use('/voters', voterRoutes);
// Upload routes
router.use('/uploads', uploadRoutes);

export const apiRouter = router;



