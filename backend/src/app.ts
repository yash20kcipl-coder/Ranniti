import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { apiRouter } from './routes';
import compression from 'compression';
import { ApiError } from './utils/apiError';
import { fileUrlMiddleware } from './utils/fileUrl';
import { errorHandler } from './middlewares/error.middleware';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware';
import { responseTimeLogger } from './middlewares/responseTime.middleware';
import express, { Express, Request, Response, NextFunction } from 'express';

export const createApp = (): Express => {
  const app = express();

  // API Response time & performance monitoring logger
  app.use(responseTimeLogger);

  // Response compression (gzip/deflate) for high-performance payload transfer
  app.use(compression());

  // Security HTTP headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Enable CORS
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Request logging
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parser (configured with 50mb limit to handle bulk imports, voter profiles, and large payloads)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global request sanitizer: strips HTML/script tags and prevents Stored XSS
  app.use(sanitizeMiddleware);

  // File URL helper middleware & static uploads folder
  app.use(fileUrlMiddleware);
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API v1 routes
  app.use('/api/v1', apiRouter);

  // Handle 404 routes
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(ApiError.notFound('API endpoint not found'));
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
};
