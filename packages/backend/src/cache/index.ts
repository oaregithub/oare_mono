import { createClient } from 'redis';
import { API_PATH } from '@/setupRoutes';
import { User } from '@oare/types';

const redis = createClient();
// FIXME setup prod redis
redis.connect();

export interface CacheKey {
  req: {
    originalUrl: string;
    user: User | null;
  };
}

export interface ClearCacheOptions {
  level: 'exact' | 'startsWith';
}

class Cache {
  public async insert<T>(
    key: CacheKey,
    response: T,
    filter: (value: T, user: User | null) => Promise<T>,
    expireInHours?: number
  ): Promise<T> {
    await redis.set(key.req.originalUrl, JSON.stringify(response), {
      EX: expireInHours ? expireInHours * 60 * 60 : undefined,
    });
    return await filter(response, key.req.user);
  }

  public async retrieve<T>(
    key: CacheKey,
    filter: (value: T, user: User | null) => Promise<T>
  ): Promise<T | null> {
    const cachedValue = await redis.get(key.req.originalUrl);
    if (!cachedValue) {
      return null;
    }

    return await filter(JSON.parse(cachedValue), key.req.user);
  }

  public async clear(url: string, options: ClearCacheOptions) {
    if (options.level === 'exact') {
      await redis.del(`${API_PATH}${url}`);
    } else if (options.level === 'startsWith') {
      const matchingKeys = await redis.keys(`${API_PATH}${url}*`);
      await Promise.all(matchingKeys.map(match => redis.del(match)));
    }
  }

  public async flush() {
    await redis.flushDb();
  }
}

export default new Cache();
