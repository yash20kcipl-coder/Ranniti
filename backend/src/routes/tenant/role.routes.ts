import { Router } from 'express';
import { authenticateJwt, requireLeader } from '../../middlewares/auth.middleware';
import { tenantUserRoleController } from '../../controllers/tenant/tenantUserRole.controller';

const router = Router();

// Protect all Tenant User Role routes (Leader or higher)
router.use(authenticateJwt, requireLeader);

router.get('/', tenantUserRoleController.getTenantUserRoles);
router.post('/', tenantUserRoleController.createTenantUserRole);
router.put('/:id', tenantUserRoleController.updateTenantUserRole);
router.get('/:id', tenantUserRoleController.getTenantUserRoleById);
router.delete('/:id', tenantUserRoleController.deleteTenantUserRole);

export const tenantRoleRoutes = router;
