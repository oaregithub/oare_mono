import { Request, Response, NextFunction } from 'express';
import { CacheKey } from '@/cache';
import sl from '@/serviceLocator';
import { User } from '@oare/types';
import { HttpInternalError } from '@/exceptions';

const cacheMiddleware = <T>(
  filter: (value: T, user: User | null) => Promise<T>
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const CacheStatusDao = sl.get('CacheStatusDao');
    const cache = sl.get('cache');
    const cacheIsEnabled =
      process.env.NODE_ENV === 'test' ||
      ((await CacheStatusDao.cacheIsEnabled()) &&
        process.env.DB_SOURCE !== 'readonly');

    const key: CacheKey = { req };

    if (cacheIsEnabled) {
      const cachedValue = await cache.retrieve<T>(key, filter);
      if (cachedValue) {
        res.json(cachedValue);
        return;
      }
    }

    next();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
};

export default cacheMiddleware;
