import { Router } from 'express';
import { authenticateJwt, requireLeader } from '../middlewares/auth.middleware';
import { tenantUserRoleController } from '../controllers/tenantUserRole.controller';

const router = Router();

// Protect all Tenant User Role routes (Leader or higher)
router.use(authenticateJwt, requireLeader);

router.get('/', tenantUserRoleController.getTenantUserRoles);
router.get('/:id', tenantUserRoleController.getTenantUserRoleById);
router.post('/', tenantUserRoleController.createTenantUserRole);
router.put('/:id', tenantUserRoleController.updateTenantUserRole);
router.delete('/:id', tenantUserRoleController.deleteTenantUserRole);

export default router;
