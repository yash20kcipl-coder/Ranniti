import path from 'path';
import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { toFileUrl } from '../utils/fileUrl';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class UploadController {
  static uploadFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded. Please select a valid file.');
    }

    const relativeDirPath = path.relative(process.cwd(), req.file.destination).replace(/\\/g, '/');
    const relativeFilePath = `/${relativeDirPath}/${req.file.filename}`;
    const fullPublicUrl = toFileUrl(relativeFilePath, req);

    const response = ApiResponse.success(
      {
        filePath: relativeFilePath,
        fileUrl: fullPublicUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      'File uploaded successfully',
      201
    );

    res.status(response.statusCode).json(response.body);
  });
}
