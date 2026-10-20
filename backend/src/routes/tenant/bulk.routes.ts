import { Router } from 'express';
import { excelUpload } from '../../middlewares/upload.middleware';
import { TenantBulkController } from '../../controllers/tenant/tenantBulk.controller';

const router = Router();

// --- TENANT BULK IMPORT & TRACKING ENDPOINTS ---
router.get('/jobs', TenantBulkController.getAllImportJobs);
router.get('/status/:jobId', TenantBulkController.getBulkImportStatus);
router.get('/failed-records/:jobId', TenantBulkController.downloadFailedRecords);
router.post('/file/:category', excelUpload.single('file'), TenantBulkController.startBulkImportFile);
router.post('/:category', TenantBulkController.startBulkImport);
router.get('/sample-template/:category', TenantBulkController.downloadSampleTemplate);

export const tenantBulkRoutes = router;
