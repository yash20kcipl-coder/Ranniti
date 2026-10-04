import { Router } from 'express';
import { authenticateJwt, requireSuperAdmin } from '../../middlewares/auth.middleware';
import { tenantRoleController } from '../../controllers/superAdmin/tenantRole.controller';

const router = Router();

// Protect all Super Admin tenant feature role routes
router.use(authenticateJwt, requireSuperAdmin);

router.get('/', tenantRoleController.getTenantRoles);
router.post('/', tenantRoleController.createTenantRole);
router.put('/:id', tenantRoleController.updateTenantRole);
router.get('/:id', tenantRoleController.getTenantRoleById);
router.delete('/:id', tenantRoleController.deleteTenantRole);
router.patch('/:id/set-default', tenantRoleController.setDefaultTenantRole);

export const superAdminRoleRoutes = router;
