import { Request, Response, NextFunction } from 'express';
import cache from '../cache';

function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.user ? req.user.id : null;
  const key = { reqPath: req.originalUrl, userId };
  if (cache.contains(key)) {
    res.json(cache.retrieve(key));
    return;
  }
  next();
}

export default cacheMiddleware;
