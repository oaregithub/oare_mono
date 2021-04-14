import { Request, Response, NextFunction } from 'express';
import cache, { CacheKey } from '@/cache';
import sl from '@/serviceLocator';

const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const CacheStatusDao = sl.get('CacheStatusDao');
  const cacheIsEnabled =
    process.env.NODE_ENV === 'test' || (await CacheStatusDao.cacheIsEnabled());

  const key: CacheKey = { req };
  if (cache.contains(key) && cacheIsEnabled) {
    res.json(cache.retrieve(key));
    return;
  }
  next();
};

export default cacheMiddleware;
