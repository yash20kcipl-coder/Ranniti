import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileAccessController } from '../../controllers/mobile/mobileAccess.controller';

const router = Router();

router.get('/roles', authenticateMobileUser, mobileAccessController.getAvailableRoles);
router.get('/role-access', authenticateMobileUser, mobileAccessController.getRoleAccess);

export const mobileAccessRoutes = router;
