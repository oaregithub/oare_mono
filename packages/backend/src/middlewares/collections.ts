import { Request, Response, NextFunction } from 'express';
import { HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';

async function collectionsMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user || null;
  const uuid = req.params.uuid as string;

  const HierarchyDao = sl.get('HierarchyDao');

  if (!user || !user.isAdmin) {
    const isCollectionPublished = await HierarchyDao.isPublished(uuid);
    if (!isCollectionPublished) {
      next(new HttpForbidden('You do not have access to that collection.'));
      return;
    }
  }
  next();
}

export default collectionsMiddleware;
