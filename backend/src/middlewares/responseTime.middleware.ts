import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Default threshold in milliseconds to flag an API request as "SLOW"
const SLOW_API_THRESHOLD_MS = parseInt(process.env.SLOW_API_THRESHOLD_MS || '300', 10);

/**
 * Express Middleware to track API response execution time in milliseconds (ms).
 * Helps identify slow API endpoints and performance bottlenecks.
 */
export const responseTimeLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    // Convert nanoseconds to milliseconds with 2 decimal precision
    const durationMs = Number(endTime - startTime) / 1e6;
    const formattedDuration = durationMs.toFixed(2);

    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    const logMessage = `[API PERF] ${method} ${url} | Status: ${status} | Time: ${formattedDuration}ms`;

    if (durationMs >= SLOW_API_THRESHOLD_MS) {
      logger.warn(`⚠️ SLOW API DETECTED! ${logMessage} (Exceeded threshold: ${SLOW_API_THRESHOLD_MS}ms)`);
    } else {
      logger.info(`⚡ ${logMessage}`);
    }
  });

  next();
};
