import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Gets the base URL for static files and uploads.
 * Defaults to config.fileBaseUrl or derives from incoming Express request.
 */
export const getFileBaseUrl = (req?: Request): string => {
  if (config.fileBaseUrl) {
    return config.fileBaseUrl.replace(/\/+$/, '');
  }
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || `localhost:${config.port}`;
    return `${protocol}://${host}`;
  }
  return `http://localhost:${config.port}`;
};

/**
 * Converts a relative file path (e.g., "/uploads/avatars/user.png")
 * into a full public absolute URL (e.g., "http://localhost:5000/uploads/avatars/user.png").
 */
export const toFileUrl = (
  filePath?: string | null,
  req?: Request
): string | null => {
  if (!filePath) return null;
  const trimmed = String(filePath).trim();
  if (
    !trimmed ||
    trimmed === '{}' ||
    trimmed.includes('{}') ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === '[object Object]'
  ) {
    return null;
  }

  // Already a complete URL or data URI
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = getFileBaseUrl(req);
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Converts an array of relative file paths into full public absolute URLs.
 */
export const toFileUrls = (
  filePaths?: (string | null | undefined)[],
  req?: Request
): string[] => {
  if (!filePaths || !Array.isArray(filePaths)) return [];
  return filePaths
    .map((path) => toFileUrl(path, req))
    .filter((url): url is string => Boolean(url));
};

/**
 * Common default keys that usually store relative file paths in API response payloads
 */
const DEFAULT_FILE_KEYS = [
  'avatar',
  'image',
  'images',
  'imageUrl',
  'imageUrls',
  'photo',
  'photos',
  'profilePic',
  'file',
  'files',
  'filePath',
  'fileUrl',
  'fileUrls',
  'document',
  'documents',
  'coverImage',
  'thumbnail',
  'thumbnails',
  'attachment',
  'attachments',
  'icon',
  'symbolLogo',
  'logo',
];

const DEFAULT_FILE_KEYS_SET = new Set(DEFAULT_FILE_KEYS);

/**
 * Recursively attaches file base URLs to matching object properties or array items in API payloads.
 *
 * @param data The payload object or array
 * @param customKeys Specific key names to target (defaults to common image/file property names)
 * @param req Optional Express request
 */
export const attachFileUrls = <T>(
  data: T,
  customKeys: string[] = DEFAULT_FILE_KEYS,
  req?: Request
): T => {
  if (!data || data instanceof Date || typeof data !== 'object') return data;

  const keySet = customKeys === DEFAULT_FILE_KEYS ? DEFAULT_FILE_KEYS_SET : new Set(customKeys);

  const transform = (item: any): any => {
    if (!item || item instanceof Date || typeof item !== 'object') return item;
    if (Array.isArray(item)) {
      return item.map(transform);
    }
    const copy = { ...item };
    for (const key of Object.keys(copy)) {
      const val = copy[key];
      if (keySet.has(key)) {
        if (typeof val === 'string') {
          copy[key] = toFileUrl(val, req);
        } else if (Array.isArray(val)) {
          copy[key] = toFileUrls(val, req);
        }
      } else if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        copy[key] = transform(val);
      }
    }
    return copy;
  };

  return transform(data) as T;
};

/**
 * Express middleware that attaches file URL helper functions to res.locals.toFileUrl and res.locals.attachFileUrls
 */
export const fileUrlMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.locals.fileBaseUrl = getFileBaseUrl(req);
  res.locals.toFileUrl = (filePath?: string | null) => toFileUrl(filePath, req);
  res.locals.attachFileUrls = <T>(data: T, customKeys?: string[]) =>
    attachFileUrls(data, customKeys, req);
  next();
};
