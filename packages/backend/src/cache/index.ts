import { createClient } from 'redis';
import { API_PATH } from '@/setupRoutes';
import { User } from '@oare/types';
import { Request } from 'express';
import {
  crossRegionCacheClear,
  crossRegionCacheFlush,
  crossRegionCacheKeys,
} from './utils';

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
    return filter(response, key.req.user);
  }

  public async retrieve<T>(
    key: CacheKey,
    filter: (value: T, user: User | null) => Promise<T>
  ): Promise<T | null> {
    const cachedValue = await redis.get(key.req.originalUrl);
    if (!cachedValue) {
      return null;
    }

    return filter(JSON.parse(cachedValue), key.req.user);
  }

  public async clear(
    url: string,
    options: ClearCacheOptions,
    req: Request,
    propogate: boolean = true
  ) {
    if (options.level === 'exact') {
      await redis.del(`${API_PATH}${url}`);
    } else if (options.level === 'startsWith') {
      const matchingKeys = await redis.keys(`${API_PATH}${url}*`);
      await Promise.all(matchingKeys.map(match => redis.del(match)));
    }

    if (propogate) {
      await crossRegionCacheClear(url, options, req);
    }
  }

  public async keys(
    url: string,
    level: 'exact' | 'startsWith',
    req: Request,
    propogate: boolean = true
  ): Promise<number> {
    let numOriginKeys = 0;
    if (level === 'exact') {
      const value = await redis.get(`${API_PATH}${url}`);
      numOriginKeys = value ? 1 : 0;
    } else {
      const keys = await redis.keys(`${API_PATH}${url}*`);
      numOriginKeys = keys.length;
    }

    let numRemoteKeys = 0;
    if (propogate) {
      numRemoteKeys = await crossRegionCacheKeys(url, level, req);
    }

    return numOriginKeys + numRemoteKeys;
  }

  public async flush(req: Request, propogate: boolean = true) {
    await redis.flushDb();

    if (propogate) {
      await crossRegionCacheFlush(req);
    }
  }
}

export default new Cache();
