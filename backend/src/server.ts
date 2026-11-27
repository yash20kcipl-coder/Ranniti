import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { closeRedis } from './config/redis';
import { closeDbPool } from './queries/dbPool';
import { TenantPoolManager } from './services/pool/tenantPoolManager';
import { SyncOutboxRetryService } from './services/sync/syncOutboxRetry.service';
import { MasterVoterSyncQueueService } from './services/sync/masterVoterSyncQueue.service';

const app = createApp();

const server = http.createServer({ maxHeaderSize: 65536 }, app);

server.listen(config.port, () => {
  logger.info(`Server running in ${config.env} mode on http://localhost:${config.port}`);
  logger.info(`Health check available at http://localhost:${config.port}/api/v1/health`);
  logger.info(`Swagger API docs available at http://localhost:${config.port}/api-docs`);

  // Start background outbox retry worker (Tenant -> Master)
  SyncOutboxRetryService.startBackgroundWorker(60000);
  // Start background voter sync retry worker (Master -> Tenant)
  MasterVoterSyncQueueService.startBackgroundWorker(120000);
});

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  SyncOutboxRetryService.stopBackgroundWorker();
  MasterVoterSyncQueueService.stopBackgroundWorker();
  server.close(async () => {
    logger.info('HTTP server closed.');
    await TenantPoolManager.closeAll();
    await closeDbPool();
    await closeRedis();
    process.exit(0);
  });

  setTimeout(async () => {
    logger.error('Could not close connections in time, forcefully shutting down');
    await TenantPoolManager.closeAll();
    await closeDbPool();
    await closeRedis();
    process.exit(1);
  }, 10000).unref();
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

