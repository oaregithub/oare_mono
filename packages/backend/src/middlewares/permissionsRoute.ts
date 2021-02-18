import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import { PermissionName } from '@oare/types';
import sl from '@/serviceLocator';
import authenticatedRoute from '@/middlewares/authenticatedRoute';

const permissionsRoute = (permission: PermissionName) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const PermissionsDao = sl.get('PermissionsDao');

    const permissionGuard = async (err?: any) => {
      if (err) {
        next(err);
        return;
      }

      const { user } = req;
      if (user) {
        const userPermissions = (
          await PermissionsDao.getUserPermissions(user)
        ).map(perm => perm.name);

        if (userPermissions.includes(permission)) {
          next();
          return;
        }
      }

      next(
        new HttpForbidden(
          'You do not have permission to perform this function.'
        )
      );
    };

    authenticatedRoute(req, res, permissionGuard);
  } catch (err) {
    next(new HttpInternalError(err));
  }
};

export default permissionsRoute;
