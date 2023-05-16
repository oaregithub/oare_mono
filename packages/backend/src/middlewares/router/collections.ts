import { Request, Response, NextFunction } from 'express';
import { HttpForbidden, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

/**
 * Restricts access to collections to only users with permission to view them.
 * Functions as a router-level middleware that can be applied in the route definition.
 * Uses the required `uuid` parameter in the request to determine which collection to check.
 */
async function collectionsMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
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
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
}

export default collectionsMiddleware;
