import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ApiError } from '../utils/apiError';
import { Request, Response, NextFunction } from 'express';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload subdirectories exist
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req: Request, _file: Express.Multer.File, cb) => {
    const category = (req.query.category as string) || (req.body.category as string) || 'voters';
    const safeSubDir = category.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.join(UPLOAD_DIR, safeSubDir);
    ensureDirExists(targetDir);
    cb(null, targetDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    cb(null, `${sanitizedBase}_${uniqueSuffix}${ext}`);
  },
});

// File Type Validation (MIME & Extension)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
  ];

  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Invalid file type '${file.mimetype}'. Only images (JPG, PNG, WEBP, GIF, SVG) and PDF documents are allowed.`));
  }
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Coerces string data from multipart/form-data requests into correct Javascript primitives.
 */
export const coerceFormDataBody = (body: Record<string, any>) => {
  if (!body || typeof body !== 'object') return;

  for (const key of Object.keys(body)) {
    let val = body[key];

    // Safely handle object values if passed for file fields
    if (typeof val === 'object' && val !== null) {
      if (typeof val.url === 'string') val = val.url;
      else if (typeof val.path === 'string') val = val.path;
      else if (typeof val.value === 'string') val = val.value;
      else if (['avatar', 'symbolLogo', 'image', 'photo', 'file'].includes(key)) {
        val = null;
      }
      body[key] = val;
    }

    if (val === '' || val === 'null' || val === 'undefined' || val === '{}' || val === '[object Object]') {
      body[key] = null;
    } else if (val === 'true') {
      body[key] = true;
    } else if (val === 'false') {
      body[key] = false;
    } else if (
      typeof val === 'string' &&
      /^-?\d+$/.test(val) &&
      ['age', 'serialNo', 'sectionNo', 'boothNumber', 'pcNumber', 'acNumber', 'totalVoters'].includes(key)
    ) {
      body[key] = parseInt(val, 10);
    }
  }
};

/**
 * Express middleware for optional file & form-data handling on API endpoints.
 * Supports both application/json and multipart/form-data seamlessly.
 */
export const optionalUpload = (defaultFieldName: string = 'file', categoryDir?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      if (categoryDir) {
        req.query.category = categoryDir;
      }
      uploadSingle.any()(req, res, (err) => {
        if (err) return next(err);

        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
          const uploadedFile = files[0];
          const relativeDirPath = path.relative(process.cwd(), uploadedFile.destination).replace(/\\/g, '/');
          const relativeFilePath = `/${relativeDirPath}/${uploadedFile.filename}`;

          req.body[defaultFieldName] = relativeFilePath;
          req.body[uploadedFile.fieldname] = relativeFilePath;
          if (defaultFieldName === 'avatar' || uploadedFile.fieldname === 'avatar') {
            req.body['avatar'] = relativeFilePath;
          }
          if (defaultFieldName === 'symbolLogo' || uploadedFile.fieldname === 'symbolLogo') {
            req.body['symbolLogo'] = relativeFilePath;
          }
        }

        coerceFormDataBody(req.body);
        next();
      });
    } else {
      next();
    }
  };
};
