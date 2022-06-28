import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';

const textMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const userUuid = req.user ? req.user.uuid : null;
    const textUuid = req.params.uuid;

    const forceAllowAdminView = req.query.forceAllowAdminView
      ? (req.query.forceAllowAdminView as string) === 'true'
      : false;

    const canViewText = await CollectionTextUtils.canViewText(
      textUuid,
      userUuid
    );

    if (!canViewText) {
      if (req.user && req.user.isAdmin && forceAllowAdminView) {
        next();
        return;
      }

      next(new HttpForbidden('You do not have permission to view this text.'));
      return;
    }

    next();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
};

export default textMiddleware;
