import sanitizeHtml from 'sanitize-html';
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
]);

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/**
 * Decodes HTML entities produced by sanitizeHtml so pure text records
 * (e.g. "Kumar & Sons") remain cleanly formatted in the database.
 */
function decodeCommonEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Sanitizes a single plain text string:
 * - Strips null bytes (\0)
 * - Completely discards all HTML tags, script vectors, and dangerous attributes
 * - Restores pure text characters (&, ", ')
 * - Trims extraneous whitespace
 */
export function sanitizePlainText(val: string): string {
  if (typeof val !== 'string' || !val) return val;
  // Strip null bytes
  const nullCleaned = val.replace(/\0/g, '');
  // Sanitize HTML and script tags
  const tagCleaned = sanitizeHtml(nullCleaned, SANITIZE_OPTIONS);
  return decodeCommonEntities(tagCleaned).trim();
}

/**
 * Recursively sanitizes an arbitrary payload (object, array, primitive).
 * Automatically preserves password/token fields and Buffer/binary instances.
 */
export function sanitizePayload<T>(data: T, parentKey = ''): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    if (SENSITIVE_KEYS.has(parentKey)) {
      return data;
    }
    return sanitizePlainText(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item, parentKey)) as unknown as T;
  }

  if (typeof data === 'object') {
    // Skip Buffers or special instances
    if (Buffer.isBuffer(data) || data instanceof Date) {
      return data;
    }

    const cleanedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (SENSITIVE_KEYS.has(key)) {
        cleanedObj[key] = val;
      } else {
        cleanedObj[key] = sanitizePayload(val, key);
      }
    }
    return cleanedObj as T;
  }

  return data;
}

/**
 * Global Express middleware that sanitizes all incoming request bodies,
 * query parameters, and URL route parameters to prevent Stored XSS,
 * HTML injection, and database pollution.
 */
export const sanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizePayload(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizePayload(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizePayload(req.params);
  }

  next();
};
