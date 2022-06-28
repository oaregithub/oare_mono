import { Request, Response, NextFunction } from 'express';
import { HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';

async function collectionsMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const HierarchyDao = sl.get('HierarchyDao');

  const { user } = req;
  const userUuid = req.user ? req.user.uuid : null;
  const uuid = req.params.uuid as string;

  if (!user || !user.isAdmin) {
    const isCollectionPublished = await HierarchyDao.isPublished(uuid);
    if (!isCollectionPublished) {
      next(new HttpForbidden('You do not have access to that collection.'));
      return;
    }
  }

  const canViewCollection = await CollectionTextUtils.canViewCollection(
    uuid,
    userUuid
  );

  if (!canViewCollection) {
    next(
      new HttpForbidden(
        'You do not have permission to view this collection. If you think this is a mistake, please contact your administrator.'
      )
    );
    return;
  }

  next();
}

export default collectionsMiddleware;
