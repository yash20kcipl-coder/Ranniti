import { Router } from 'express';
import { optionalUpload } from '../middlewares/upload.middleware';
import { tenantController } from '../controllers/tenant.controller';
import { authenticateJwt, requireSuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Strictly enforce Super Admin access for all tenant management routes
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

export const superAdminTenantRoutes = router;
