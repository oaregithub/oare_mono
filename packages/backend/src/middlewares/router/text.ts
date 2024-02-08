import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';

/**
 * Restricts access to texts to only users with permission to view them.
 * Functions as a router-level middleware that can be applied in the route definition.
 * Uses the required `uuid` parameter in the request to determine which text to check.
 */
const textMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const userUuid = req.user ? req.user.uuid : null;
    const textUuid = req.params.uuid;

    // Allows for quarantined texts to be viewed by admins. They would otherwise by blocked.
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
