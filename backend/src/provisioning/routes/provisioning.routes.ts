import { Router } from 'express';
import { authenticateJwt, requireSuperAdmin } from '../../middlewares/auth.middleware';
import { provisioningController } from '../controllers/provisioning.controller';

import { stateProvisionRoutes } from './state.provision.routes';
import { districtProvisionRoutes } from './district.provision.routes';
import { talukaProvisionRoutes } from './taluka.provision.routes';
import { villageProvisionRoutes } from './village.provision.routes';
import { religionProvisionRoutes } from './religion.provision.routes';
import { casteProvisionRoutes } from './caste.provision.routes';
import { partyProvisionRoutes } from './party.provision.routes';
import { pcProvisionRoutes } from './pc.provision.routes';
import { acProvisionRoutes } from './ac.provision.routes';
import { wardProvisionRoutes } from './ward.provision.routes';
import { boothProvisionRoutes } from './booth.provision.routes';
import { voterProvisionRoutes } from './voter.provision.routes';

const router = Router();

// Enforce Super Admin authentication for all provisioning endpoints
router.use(authenticateJwt, requireSuperAdmin);

// Orchestration Endpoints
router.get('/:tenantId/status', provisioningController.getStatus);
router.post('/:tenantId/start', provisioningController.startProvisioning);
router.post('/:tenantId/sync-incremental', provisioningController.syncIncremental);
router.post('/:tenantId/remove-constituencies', provisioningController.removeConstituencies);

// Granular Table Sync Endpoints
router.use('/:tenantId/states', stateProvisionRoutes);
router.use('/:tenantId/districts', districtProvisionRoutes);
router.use('/:tenantId/talukas', talukaProvisionRoutes);
router.use('/:tenantId/villages', villageProvisionRoutes);
router.use('/:tenantId/religions', religionProvisionRoutes);
router.use('/:tenantId/castes', casteProvisionRoutes);
router.use('/:tenantId/parties', partyProvisionRoutes);
router.use('/:tenantId/parliamentary-constituencies', pcProvisionRoutes);
router.use('/:tenantId/assembly-constituencies', acProvisionRoutes);
router.use('/:tenantId/wards', wardProvisionRoutes);
router.use('/:tenantId/booths', boothProvisionRoutes);
router.use('/:tenantId/voters', voterProvisionRoutes);

export const provisioningRoutes = router;
