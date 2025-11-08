import { Redis } from 'ioredis';
import { logger } from './logger';

/**
 * Redis Cache Utility
 * 
 * Provides caching for:
 * - User credentials (OAuth + API keys)
 * - Workflow configurations
 * - Other frequently accessed data
 */

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('error', (error) => {
      logger.error({ error }, 'Redis cache error');
    });

    // Connect asynchronously
    redisClient.connect().catch((error) => {
      logger.error({ error }, 'Failed to connect to Redis cache');
    });
  }

  return redisClient;
}

/**
 * Get value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error({ error, key }, 'Cache get error');
    return null;
  }
}

/**
 * Set value in cache with TTL (in seconds)
 */
export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error({ error, key }, 'Cache set error');
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    logger.error({ error, key }, 'Cache delete error');
  }
}

/**
 * Get or compute value (cache-aside pattern)
 */
export async function getCacheOrCompute<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    logger.debug({ key }, 'Cache hit');
    return cached;
  }

  // Cache miss - compute value
  logger.debug({ key }, 'Cache miss - computing');
  const value = await computeFn();

  // Store in cache (fire and forget)
  setCache(key, value, ttlSeconds).catch((error) => {
    logger.error({ error, key }, 'Failed to cache computed value');
  });

  return value;
}

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
  userCredentials: (userId: string) => `user:credentials:${userId}`,
  workflowConfig: (workflowId: string) => `workflow:config:${workflowId}`,
  workflowRuns: (workflowId: string) => `workflow:runs:${workflowId}`,
} as const;

/**
 * Cache TTLs (in seconds)
 */
export const CacheTTL = {
  CREDENTIALS: 300,      // 5 minutes
  WORKFLOW_CONFIG: 600,  // 10 minutes
  WORKFLOW_RUNS: 60,     // 1 minute
} as const;
