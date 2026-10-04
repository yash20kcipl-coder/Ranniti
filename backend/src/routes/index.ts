import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import { uploadRoutes } from './upload.routes';
import { mobileAuthRoutes } from './mobileAuth.routes';
import { superAdminRouter } from './superAdmin';
import { tenantRouter } from './tenant';
import { superAdminMasterRoutes } from './superAdmin/master.routes';
import { tenantVoterRoutes } from './tenant/voter.routes';
import { tenantVolunteerRoutes } from './tenant/volunteer.routes';
import { tenantDataRoutes } from './tenant/data.routes';
import { tenantUserRoutes } from './tenant/user.routes';

const router = Router();

// Health & File Upload System Utility Routes
router.use('/health', healthRoutes);
router.use('/uploads', uploadRoutes);

// Authentication Routes
router.use('/auth', authRoutes);
router.use('/mobile/auth', mobileAuthRoutes);

// Dedicated Domain Architecture Routes
router.use('/super-admin', superAdminRouter);
router.use('/tenant', tenantRouter);

// Legacy Alias Fallback Mounts (for seamless backward compatibility with existing clients)
router.use('/tenant-api', tenantRouter);
router.use('/tenant-data', tenantDataRoutes);
router.use('/volunteers', tenantVolunteerRoutes);
router.use('/voters', tenantVoterRoutes);
router.use('/masters', superAdminMasterRoutes);
router.use('/admin-users', tenantUserRoutes);

export const apiRouter = router;
