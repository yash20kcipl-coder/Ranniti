import { Router } from 'express';
import { optionalUpload } from '../../middlewares/upload.middleware';
import { tenantController } from '../../controllers/superAdmin/tenant.controller';
import { tenantSyncController } from '../../controllers/superAdmin/tenantSync.controller';
import { authenticateJwt, requireSuperAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Enforce Super Admin access for all tenant management routes
router.use(authenticateJwt, requireSuperAdmin);

router
  .route('/')
  .get(tenantController.getAllTenantUsers)
  .post(optionalUpload('avatar', 'avatars'), tenantController.provisionTenantUser);

router.post('/provision', optionalUpload('avatar', 'avatars'), tenantController.provisionTenantUser);

router
  .route('/:id')
  .get(tenantController.getTenantUserById)
  .put(optionalUpload('avatar', 'avatars'), tenantController.updateTenantUser)
  .delete(tenantController.deleteTenantUser);

router.get('/:id/status', tenantController.getTenantProvisioningStatus);
router.get('/:id/provisioning-status', tenantController.getTenantProvisioningStatus);
router.patch('/:id/status', tenantController.updateTenantStatus);

// DB Sync health check — compares tenant DB schema & data against master DB
router.get('/:id/db-sync-status', tenantSyncController.getDbSyncStatus);

export const superAdminTenantRoutes = router;
