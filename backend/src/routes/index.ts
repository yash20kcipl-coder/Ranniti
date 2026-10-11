import { Router } from 'express';
import { mobileRouter } from './mobile';
import { tenantRouter } from './tenant';
import { syncRoutes } from './sync.routes';
import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import { uploadRoutes } from './upload.routes';
import { superAdminRouter } from './superAdmin';
import { tenantUserRoutes } from './tenant/user.routes';
import { tenantDataRoutes } from './tenant/data.routes';
import { tenantVoterRoutes } from './tenant/voter.routes';
import { tenantAuth } from '../middlewares/tenantAuth.middleware';
import { publicAppVersionRoutes } from './appVersion.public.routes';
import { superAdminMasterRoutes } from './superAdmin/master.routes';
import { provisioningRoutes } from '../provisioning/routes/provisioning.routes';

const router = Router();

// Health & File Upload System Utility Routes
router.use('/sync', syncRoutes);
router.use('/health', healthRoutes);
router.use('/uploads', uploadRoutes);
router.use('/app-versions', publicAppVersionRoutes);

// Authentication & Mobile Application Routes
router.use('/auth', authRoutes);
router.use('/mobile', mobileRouter);

// Dedicated Domain Architecture Routes
router.use('/tenant', tenantRouter);
router.use('/super-admin', superAdminRouter);
router.use('/provisioning', provisioningRoutes);

// Legacy Alias Fallback Mounts (for seamless backward compatibility with existing clients)
router.use('/tenant-api', tenantRouter);
router.use('/masters', superAdminMasterRoutes);
router.use('/voters', tenantAuth, tenantVoterRoutes);
router.use('/tenant-data', tenantAuth, tenantDataRoutes);
router.use('/admin-users', tenantAuth, tenantUserRoutes);

export const apiRouter = router;
