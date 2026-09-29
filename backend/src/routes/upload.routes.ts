import { Router } from 'express';
import { uploadSingle } from '../middlewares/upload.middleware';
import { UploadController } from '../controllers/upload.controller';

const router = Router();

// POST /api/v1/uploads (form-data field name: "file")
router.post('/', uploadSingle.single('file'), UploadController.uploadFile);

export const uploadRoutes = router;
