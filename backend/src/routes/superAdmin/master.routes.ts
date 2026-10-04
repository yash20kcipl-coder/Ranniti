import { Router } from 'express';
import {
  masterIdParamSchema,
  createReligionSchema,
  updateReligionSchema,
  createCasteSchema,
  createStateSchema,
  createDistrictSchema,
  createTalukaSchema,
  updateTalukaSchema,
  createVillageSchema,
  updateVillageSchema,
  createPcSchema,
  createAcSchema,
  createWardSchema,
  updateWardSchema,
  createPartySchema,
  createBoothSchema,
} from '../../schemas/master.schema';
import { validate } from '../../middlewares/validate.middleware';
import { optionalUpload } from '../../middlewares/upload.middleware';
import { masterController } from '../../controllers/master.controller';
import { MasterBulkController } from '../../controllers/superAdmin/masterBulk.controller';

const router = Router();

// --- BULK IMPORT & SAMPLE TEMPLATES ---
router.get('/bulk-import/jobs', MasterBulkController.getAllImportJobs);
router.post('/bulk-import/:category', MasterBulkController.startBulkImport);
router.get('/bulk-import/status/:jobId', MasterBulkController.getBulkImportStatus);
router.get('/sample-template/:category', MasterBulkController.downloadSampleTemplate);

// --- MASTER DATA AUTO-SYNC ---
router.post('/sync', masterController.syncMasters);

// --- RELIGIONS ---
router
  .route('/religions')
  .get(masterController.getReligions)
  .post(validate(createReligionSchema), masterController.createReligion);

router
  .route('/religions/:id')
  .get(validate(masterIdParamSchema), masterController.getReligionById)
  .put(validate(updateReligionSchema), masterController.updateReligion)
  .delete(validate(masterIdParamSchema), masterController.deleteReligion);

// --- CASTES ---
router
  .route('/castes')
  .get(masterController.getCastes)
  .post(validate(createCasteSchema), masterController.createCaste);

router
  .route('/castes/:id')
  .put(validate(masterIdParamSchema), masterController.updateCaste)
  .delete(validate(masterIdParamSchema), masterController.deleteCaste);

// --- STATES ---
router
  .route('/states')
  .get(masterController.getStates)
  .post(validate(createStateSchema), masterController.createState);

router
  .route('/states/:id')
  .put(validate(masterIdParamSchema), masterController.updateState)
  .delete(validate(masterIdParamSchema), masterController.deleteState);

// --- DISTRICTS ---
router
  .route('/districts')
  .get(masterController.getDistricts)
  .post(validate(createDistrictSchema), masterController.createDistrict);

router
  .route('/districts/:id')
  .put(validate(masterIdParamSchema), masterController.updateDistrict)
  .delete(validate(masterIdParamSchema), masterController.deleteDistrict);

// --- TALUKAS ---
router
  .route('/talukas')
  .get(masterController.getTalukas)
  .post(validate(createTalukaSchema), masterController.createTaluka);

router
  .route('/talukas/:id')
  .get(validate(masterIdParamSchema), masterController.getTalukaById)
  .put(validate(updateTalukaSchema), masterController.updateTaluka)
  .delete(validate(masterIdParamSchema), masterController.deleteTaluka);

// --- VILLAGES ---
router
  .route('/villages')
  .get(masterController.getVillages)
  .post(validate(createVillageSchema), masterController.createVillage);

router
  .route('/villages/:id')
  .get(validate(masterIdParamSchema), masterController.getVillageById)
  .put(validate(updateVillageSchema), masterController.updateVillage)
  .delete(validate(masterIdParamSchema), masterController.deleteVillage);

// --- PARLIAMENTARY CONSTITUENCIES (PC) ---
router
  .route('/pcs')
  .get(masterController.getPcs)
  .post(validate(createPcSchema), masterController.createPc);

router
  .route('/pcs/:id')
  .put(validate(masterIdParamSchema), masterController.updatePc)
  .delete(validate(masterIdParamSchema), masterController.deletePc);

// --- ASSEMBLY CONSTITUENCIES (AC) ---
router
  .route('/acs')
  .get(masterController.getAcs)
  .post(validate(createAcSchema), masterController.createAc);

router
  .route('/acs/:id')
  .put(validate(masterIdParamSchema), masterController.updateAc)
  .delete(validate(masterIdParamSchema), masterController.deleteAc);

// --- WARDS ---
router
  .route('/wards')
  .get(masterController.getWards)
  .post(validate(createWardSchema), masterController.createWard);

router
  .route('/wards/:id')
  .get(validate(masterIdParamSchema), masterController.getWardById)
  .put(validate(updateWardSchema), masterController.updateWard)
  .delete(validate(masterIdParamSchema), masterController.deleteWard);

// --- PARTIES ---
router
  .route('/parties')
  .get(masterController.getParties)
  .post(optionalUpload('symbolLogo', 'parties'), validate(createPartySchema), masterController.createParty);

router
  .route('/parties/:id')
  .put(optionalUpload('symbolLogo', 'parties'), masterController.updateParty)
  .delete(validate(masterIdParamSchema), masterController.deleteParty);

// --- BOOTHS ---
router
  .route('/booths/options')
  .get(masterController.getBoothOptions);

router
  .route('/booths')
  .get(masterController.getBooths)
  .post(validate(createBoothSchema), masterController.createBooth);

router
  .route('/booths/:id')
  .put(validate(masterIdParamSchema), masterController.updateBooth)
  .delete(validate(masterIdParamSchema), masterController.deleteBooth);

export const superAdminMasterRoutes = router;
