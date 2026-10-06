import { Router } from 'express';
import { tenantRouter } from './tenant';
import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import { uploadRoutes } from './upload.routes';
import { superAdminRouter } from './superAdmin';
import { mobileAuthRoutes } from './mobileAuth.routes';
import { tenantUserRoutes } from './tenant/user.routes';
import { tenantDataRoutes } from './tenant/data.routes';
import { tenantVoterRoutes } from './tenant/voter.routes';
import { tenantVolunteerRoutes } from './tenant/volunteer.routes';
import { superAdminMasterRoutes } from './superAdmin/master.routes';

import { mobileRouter } from './mobile';

const router = Router();

// Health & File Upload System Utility Routes
router.use('/health', healthRoutes);
router.use('/uploads', uploadRoutes);

// Authentication & Mobile Application Routes
router.use('/auth', authRoutes);
router.use('/mobile', mobileRouter);

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
