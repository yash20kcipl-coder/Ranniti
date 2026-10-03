import {
  createAdminUserSchema,
  updateAdminUserSchema,
  getAdminUserByIdSchema,
} from '../schemas/admin_user.schema';
import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { adminUserController } from '../controllers/admin_user.controller';
import { authenticateJwt, requireAdmin, requireSubLeader } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/team', requireSubLeader, adminUserController.getTeamMembers);

router
  .route('/')
  .get(requireAdmin, adminUserController.getAdminUsers)
  .post(requireSubLeader, validate(createAdminUserSchema), adminUserController.createAdminUser);

router
  .route('/:id')
  .get(requireSubLeader, validate(getAdminUserByIdSchema), adminUserController.getAdminUserById)
  .put(requireAdmin, validate(updateAdminUserSchema), adminUserController.updateAdminUser)
  .delete(requireAdmin, validate(getAdminUserByIdSchema), adminUserController.deleteAdminUser);

export const adminUserRoutes = router;
export const userRoutes = adminUserRoutes; // Backward-compatibility export

