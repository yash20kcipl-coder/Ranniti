import {
  createAdminUserSchema,
  updateAdminUserSchema,
  getAdminUserByIdSchema,
  updateAdminUserStatusSchema,
} from '../../schemas/admin_user.schema';
import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { optionalUpload } from '../../middlewares/upload.middleware';
import { authenticateJwt, requireAdmin } from '../../middlewares/auth.middleware';
import { adminUserController } from '../../controllers/tenant/admin_user.controller';

const router = Router();

router.use(authenticateJwt);

router.get('/volunteers', requireAdmin, adminUserController.getVolunteers);
router.get('/volunteers/coverage', requireAdmin, adminUserController.getVolunteerBoothCoverage);

router.get('/team', requireAdmin, adminUserController.getTeamMembers);

// Dedicated status toggle / update routes
router.patch(
  '/volunteers/:id/status',
  requireAdmin,
  validate(updateAdminUserStatusSchema),
  adminUserController.toggleVolunteerStatus
);

router.patch(
  '/:id/status',
  requireAdmin,
  validate(updateAdminUserStatusSchema),
  adminUserController.toggleVolunteerStatus
);

router
  .route('/')
  .get(requireAdmin, adminUserController.getAdminUsers)
  .post(
    requireAdmin,
    optionalUpload('avatar', 'avatars'),
    validate(createAdminUserSchema),
    adminUserController.createAdminUser
  );

router
  .route('/:id')
  .get(requireAdmin, validate(getAdminUserByIdSchema), adminUserController.getAdminUserById)
  .put(
    requireAdmin,
    optionalUpload('avatar', 'avatars'),
    validate(updateAdminUserSchema),
    adminUserController.updateAdminUser
  )
  .delete(requireAdmin, validate(getAdminUserByIdSchema), adminUserController.deleteAdminUser);

export const tenantUserRoutes = router;
