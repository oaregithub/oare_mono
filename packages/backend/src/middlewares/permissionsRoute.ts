import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import { PermissionItem } from '@oare/types';
import sl from '@/serviceLocator';
import authenticatedRoute from '@/middlewares/authenticatedRoute';

const permissionsRoute = (permissions: PermissionItem['name'][]) => async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = req;
    const PermissionsDao = sl.get('PermissionsDao');
    let hasPermission = false;

    const permissionGuard = async (err?: any) => {
      if (err) {
        next(err);
      }

      if (user) {
        const userPermissions = (await PermissionsDao.getUserPermissions(user)).map((permission) => permission.name);

        permissions.forEach((permission) => {
          if (userPermissions.includes(permission)) {
            hasPermission = true;
          }
        });
      }

      if (hasPermission) {
        next();
      } else {
        next(new HttpForbidden('You do not have permission to perform this function.'));
      }
    };

    authenticatedRoute(req, res, await permissionGuard);
  } catch (err) {
    next(new HttpInternalError(err));
  }
};

export default permissionsRoute;
