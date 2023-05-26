import { createClient } from 'redis';
import { API_PATH } from '@/setupRoutes';
import { User } from '@oare/types';

// FIXME - handle situation where redis client is down. Right now, the server will crash. It should just actually complete the routes as if nothing were cached.

/**
 * Creates Redis client and stores it
 */
const redis = createClient(
  process.env.NODE_ENV === 'production'
    ? {
        socket: {
          host: process.env.REDIS_HOST,
          port: 6379,
        },
      }
    : undefined
);
// Creates connection to Redis client
redis.connect();

/**
 * Defines the shape of a cache key. Based of of Express Request object.
 */
export interface CacheKey {
  req: {
    originalUrl: string;
    user: User | null;
  };
}

/**
 * Defines the options for clearing the cache.
 */
export interface ClearCacheOptions {
  level: 'exact' | 'startsWith';
}

/**
 * Defines the shape of a cache filter function.
 */
export type CacheFilter<T> = (value: T, user: User | null) => Promise<T>;

class Cache {
  /**
   * Inserts a value into the cache. Requires a response type to be specified.
   * @param key The cache key, based off of the Express Request object. `{ req }`
   * @param response The response value to be cached. This should not be filtered or user-specific.
   * Instead, the full 'source-of-truth' value should be cached.
   * @param filter A function that filters the cached value.
   * Allows for the cached value to be modified before being sent to the client, as needed.
   * The filter function must implement the `CacheFilter` type. Can be `null`.
   * @param expireInHours The number of hours before the cache expires automatically. Optional.
   * @returns The filtered cached value. If no filter is specified, the original value is returned.
   * The filtered value is what should be sent to the client.
   * This allows for a user with limited access to receive a filtered value despite their request
   * being cached with a full value.
   */
  public async insert<T>(
    key: CacheKey,
    response: T,
    filter: CacheFilter<T> | null,
    expireInHours?: number
  ): Promise<T> {
    await redis.set(key.req.originalUrl, JSON.stringify(response), {
      EX: expireInHours ? expireInHours * 60 * 60 : undefined,
    });
    if (filter === null) {
      return response;
    }
    return filter(response, key.req.user);
  }

  /**
   * Retrieves a value from the cache. Requires a response type to be specified.
   * @param key The cache key, based off of the Express Request object. `{ req }`
   * @param filter A function that filters the cached value.
   * Allows for the cached value to be modified before being sent to the client, as needed.
   * The filter function must implement the `CacheFilter` type. Can be `null`.
   * @returns A filtered cached value. If no filter is specified, the original value is returned.
   */
  public async retrieve<T>(
    key: CacheKey,
    filter: CacheFilter<T> | null
  ): Promise<T | null> {
    const cachedValue = await redis.get(key.req.originalUrl);
    if (!cachedValue) {
      return null;
    }

    const response = JSON.parse(cachedValue);

    if (filter === null) {
      return response;
    }
    return filter(response, key.req.user);
  }

  /**
   * Clears the cached value(s) for a given URL key.
   * @param url The URL key to clear.
   * @param options Used to specify the level of URL matching. Can be `exact` or `startsWith`.
   */
  public async clear(url: string, options: ClearCacheOptions) {
    if (options.level === 'exact') {
      await redis.del(`${API_PATH}${url}`);
    } else if (options.level === 'startsWith') {
      const matchingKeys = await redis.keys(`${API_PATH}${url}*`);
      await Promise.all(matchingKeys.map(match => redis.del(match)));
    }
  }

  /**
   * Returns the number of keys in the cache for a given URL key.
   * Used to determine if a URL is cached or not before clearing.
   * @param url The URL key to check.
   * @param level Used to specify the level of URL matching. Can be `exact` or `startsWith`.
   * @returns Number of keys in the cache for the given URL key.
   */
  public async keys(
    url: string,
    level: 'exact' | 'startsWith'
  ): Promise<number> {
    let numKeys = 0;
    if (level === 'exact') {
      const value = await redis.get(`${API_PATH}${url}`);
      numKeys = value ? 1 : 0;
    } else {
      const keys = await redis.keys(`${API_PATH}${url}*`);
      numKeys = keys.length;
    }

    return numKeys;
  }

  /**
   * Flushes the entire cache.
   */
  public async flush() {
    await redis.flushDb();
  }
}

/**
 * Cache instance as a singleton.
 */
export default new Cache();
