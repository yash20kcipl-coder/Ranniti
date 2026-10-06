import {
  createAdminUserSchema,
  updateAdminUserSchema,
  getAdminUserByIdSchema,
  updateAdminUserStatusSchema,
} from '../../schemas/admin_user.schema';
import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { optionalUpload } from '../../middlewares/upload.middleware';
import { adminUserController } from '../../controllers/tenant/admin_user.controller';
import { authenticateJwt, requireAdmin, requireSubLeader } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/volunteers', requireSubLeader, adminUserController.getVolunteers);
router.get('/volunteers/coverage', requireSubLeader, adminUserController.getVolunteerBoothCoverage);

router.get('/team', requireSubLeader, adminUserController.getTeamMembers);

// Dedicated status toggle / update routes
router.patch(
  '/volunteers/:id/status',
  requireSubLeader,
  validate(updateAdminUserStatusSchema),
  adminUserController.toggleVolunteerStatus
);

router.patch(
  '/:id/status',
  requireSubLeader,
  validate(updateAdminUserStatusSchema),
  adminUserController.toggleVolunteerStatus
);

router
  .route('/')
  .get(requireAdmin, adminUserController.getAdminUsers)
  .post(
    requireSubLeader,
    optionalUpload('avatar', 'avatars'),
    validate(createAdminUserSchema),
    adminUserController.createAdminUser
  );

router
  .route('/:id')
  .get(requireSubLeader, validate(getAdminUserByIdSchema), adminUserController.getAdminUserById)
  .put(
    requireAdmin,
    optionalUpload('avatar', 'avatars'),
    validate(updateAdminUserSchema),
    adminUserController.updateAdminUser
  )
  .delete(requireAdmin, validate(getAdminUserByIdSchema), adminUserController.deleteAdminUser);

export const tenantUserRoutes = router;
