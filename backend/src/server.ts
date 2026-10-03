import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { closeDbPool } from './queries/dbPool';
import { TenantPoolManager } from './services/pool/tenantPoolManager';
import { SyncOutboxRetryService } from './services/sync/syncOutboxRetry.service';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`Server running in ${config.env} mode on http://localhost:${config.port}`);
  logger.info(`Health check available at http://localhost:${config.port}/api/v1/health`);
  
  // Start background outbox retry worker
  SyncOutboxRetryService.startBackgroundWorker(60000);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  SyncOutboxRetryService.stopBackgroundWorker();
  server.close(async () => {
    logger.info('HTTP server closed.');
    await TenantPoolManager.closeAll();
    await closeDbPool();
    process.exit(0);
  });

  setTimeout(async () => {
    logger.error('Could not close connections in time, forcefully shutting down');
    await TenantPoolManager.closeAll();
    await closeDbPool();
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

