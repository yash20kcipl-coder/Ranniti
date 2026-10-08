import { Router } from 'express';
import { superAdminDashboardController } from '../../controllers/superAdmin/dashboard.controller';

const router = Router();

// Platform KPIs and aggregated metrics
router.get('/metrics', superAdminDashboardController.getPlatformMetrics);

// Live and recent background bulk import jobs
router.get('/imports', superAdminDashboardController.getImportJobs);

// Recent security and platform audit logs
router.get('/audit-feed', superAdminDashboardController.getAuditFeed);

export const superAdminDashboardRoutes = router;
