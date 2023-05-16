import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import { PermissionName } from '@oare/types';
import sl from '@/serviceLocator';
import authenticatedRoute from '@/middlewares/router/authenticatedRoute';

/**
 * Restricts access to the route to only authenticated users with the specified permission.
 * Functions as a router-level middleware that can be applied in the route definition.
 * 403 Forbidden Error is sent to the client if the requesting user does not have the specified permission.
 * @param permission The permission that is required to access the route.
 */
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
          await PermissionsDao.getUserPermissions(user.uuid)
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

    // Verifies that the user is authenticated before checking permissions.
    authenticatedRoute(req, res, permissionGuard);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
};

export default permissionsRoute;
