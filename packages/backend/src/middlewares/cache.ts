import { Request, Response, NextFunction } from 'express';
import cache, { CacheKey } from '@/cache';

function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  const key: CacheKey = { req };
  if (cache.contains(key)) {
    res.json(cache.retrieve(key));
    return;
  }
  next();
}

export default cacheMiddleware;
