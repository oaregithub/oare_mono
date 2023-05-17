import { Request, Response, NextFunction } from 'express';
import { CacheKey, CacheFilter } from '@/cache';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';

/**
 * Attempts to retrieve a value from the cache before proceeding to the API route.
 * Functions as a router-level middleware that can be applied in the route definition.
 * @param filter A function that filters the cached value. Allows for the cached value to be modified before being sent to the client, as needed.
 * A type should be specified for the filter. Can be `null`.
 */
const cacheMiddleware = <T>(filter: CacheFilter<T> | null) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
