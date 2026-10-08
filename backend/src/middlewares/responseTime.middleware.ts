import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { requestContextStorage, DataSourceTracker } from '../utils/dataSourceTracker';

// Default threshold in milliseconds to flag an API request as "SLOW"
const SLOW_API_THRESHOLD_MS = parseInt(process.env.SLOW_API_THRESHOLD_MS || '300', 10);

/**
 * Express Middleware to track API response execution time in milliseconds (ms)
 * and log the exact data origin (Tenant DB, Master DB, Redis, or Direct/Memory).
 */
export const responseTimeLogger = (req: Request, res: Response, next: NextFunction): void => {
  const context = { sources: new Set<string>() };

  requestContextStorage.run(context, () => {
    const startTime = process.hrtime.bigint();

    // Hook res.json to set X-Data-Source header before response is sent
    const origJson = res.json.bind(res);
    res.json = (body: any) => {
      try {
        if (!res.headersSent) {
          const sources = Array.from(context.sources);
          const sourceLabel = sources.length > 0 ? sources.join(' + ') : 'Direct / Memory';
          res.setHeader('X-Data-Source', sourceLabel);
        }
      } catch {}
      return origJson(body);
    };

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      // Convert nanoseconds to milliseconds with 2 decimal precision
      const durationMs = Number(endTime - startTime) / 1e6;
      const formattedDuration = durationMs.toFixed(2);

      const status = res.statusCode;
      const method = req.method;
      const url = req.originalUrl || req.url;

      const sources = Array.from(context.sources);
      const sourceLabel = sources.length > 0 ? sources.join(' + ') : 'Direct / Memory';

      const colorSource = (src: string) => {
        if (src.includes('Redis')) return `\x1b[31m${src}\x1b[0m`; // Red
        if (src.includes('Master DB')) return `\x1b[36m${src}\x1b[0m`; // Cyan
        if (src.includes('Tenant DB')) return `\x1b[35m${src}\x1b[0m`; // Magenta
        return src;
      };

      const coloredSources = sources.map(colorSource);
      const coloredSourceLabel = coloredSources.length > 0 ? coloredSources.join(' + ') : 'Direct / Memory';

      const logMessage = `[API PERF] ${method} ${url} | Status: ${status} | Time: ${formattedDuration}ms | Data Source: [${coloredSourceLabel}]`;

      if (durationMs >= SLOW_API_THRESHOLD_MS) {
        logger.warn(`⚠️ SLOW API DETECTED! ${logMessage} (Exceeded threshold: ${SLOW_API_THRESHOLD_MS}ms)`);
      } else {
        logger.info(`⚡ ${logMessage}`);
      }
    });

    next();
  });
};
