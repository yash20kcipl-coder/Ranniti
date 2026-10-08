import { Router } from 'express';
import { authenticateMobileUser } from '../../middlewares/mobileAuth.middleware';
import { mobileContactSyncController } from '../../controllers/mobile/mobileContactSync.controller';

const router = Router();

// Synchronize device contacts
router.post('/sync-contacts', authenticateMobileUser, mobileContactSyncController.syncContacts);

// Fetch paginated synced voters
router.get('/synced-contacts', authenticateMobileUser, mobileContactSyncController.getSyncedContacts);

// Remove/unlink a synced contact
router.delete('/synced-contacts/:voterId', authenticateMobileUser, mobileContactSyncController.removeSyncedContact);

export const mobileContactSyncRoutes = router;
