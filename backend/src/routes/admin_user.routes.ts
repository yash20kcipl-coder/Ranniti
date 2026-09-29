import {
  createAdminUserSchema,
  updateAdminUserSchema,
  getAdminUserByIdSchema,
} from '../schemas/admin_user.schema';
import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { adminUserController } from '../controllers/admin_user.controller';
import { authenticateJwt, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJwt, requireAdmin);

router
  .route('/')
  .get(adminUserController.getAdminUsers)
  .post(validate(createAdminUserSchema), adminUserController.createAdminUser);

router
  .route('/:id')
  .get(validate(getAdminUserByIdSchema), adminUserController.getAdminUserById)
  .put(validate(updateAdminUserSchema), adminUserController.updateAdminUser)
  .delete(validate(getAdminUserByIdSchema), adminUserController.deleteAdminUser);

export const adminUserRoutes = router;
export const userRoutes = adminUserRoutes; // Backward-compatibility export

