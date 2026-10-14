import { logger } from '../utils/logger';
import { redisClient, closeRedis } from '../config/redis';

/**
 * Ensures the Redis client has established a connection and is in 'ready' state.
 */
export async function ensureRedisReady(timeoutMs = 3000): Promise<boolean> {
  const client = redisClient;
  if (!client) {
    logger.warn('⚠️ Redis is disabled (REDIS_ENABLED is not true).');
    return false;
  }
  if (client.status === 'ready') {
    return true;
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      logger.warn(`⚠️ Redis connection timeout after ${timeoutMs}ms.`);
      resolve(client.status === 'ready');
    }, timeoutMs);

    client.once('ready', () => {
      clearTimeout(timer);
      resolve(true);
    });

    client.once('error', (err) => {
      clearTimeout(timer);
      logger.warn(`⚠️ Redis connection error: ${err.message}`);
      resolve(false);
    });
  });
}

/**
 * Scans and invalidates Redis keys matching a specific pattern.
 */
export async function cleanRedisPattern(pattern: string): Promise<string[]> {
  const isReady = await ensureRedisReady();
  if (!isReady || !redisClient) {
    return [];
  }

  const stream = redisClient.scanStream({
    match: pattern,
    count: 100,
  });

  const keysToDelete: string[] = [];

  stream.on('data', (resultKeys: string[]) => {
    if (resultKeys && resultKeys.length > 0) {
      keysToDelete.push(...resultKeys);
    }
  });

  await new Promise<void>((resolve, reject) => {
    stream.on('end', () => resolve());
    stream.on('error', (err) => reject(err));
  });

  if (keysToDelete.length > 0) {
    for (let i = 0; i < keysToDelete.length; i += 100) {
      const chunk = keysToDelete.slice(i, i + 100);
      await redisClient.del(...chunk);
    }
  }

  return keysToDelete;
}

async function run() {
  const args = process.argv.slice(2);

  let pattern = 'ranniti:*';
  let isFlushAll = false;

  for (const arg of args) {
    if (arg === '--all' || arg === 'all') {
      pattern = 'ranniti:*';
    } else if (arg === 'masters' || arg === '--masters') {
      pattern = 'ranniti:masters:*';
    } else if (arg === 'locations' || arg === '--locations') {
      pattern = 'ranniti:masters:*:*';
    } else if (arg.startsWith('--pattern=')) {
      pattern = arg.replace('--pattern=', '').trim();
    } else if (arg === '--flush-db') {
      isFlushAll = true;
    } else if (!arg.startsWith('-')) {
      pattern = arg.trim();
    }
  }

  try {
    const isReady = await ensureRedisReady();
    if (!isReady || !redisClient) {
      console.log('Redis is not connected. Nothing to clean.');
      return;
    }

    if (isFlushAll) {
      await redisClient.flushdb();
      console.log('🧹 Flushed current Redis database successfully (FLUSHDB).');
      return;
    }

    // Default or targeted pattern scan
    console.log(`🔍 Scanning Redis for keys matching pattern: '${pattern}'...`);
    const deletedKeys = await cleanRedisPattern(pattern);

    if (deletedKeys.length === 0) {
      console.log(`ℹ️ No Redis keys matched '${pattern}'.`);
    } else {
      console.log(`\n✅ Successfully deleted ${deletedKeys.length} Redis cache keys:`);
      deletedKeys.forEach((k) => console.log(`   - ${k}`));
    }

    console.log('\n🎉 Redis cache cleanup completed.\n');
  } catch (err: any) {
    logger.error('❌ Redis cleanup failed:', err);
    process.exitCode = 1;
  } finally {
    await closeRedis();
  }
}

if (require.main === module) {
  run();
}
