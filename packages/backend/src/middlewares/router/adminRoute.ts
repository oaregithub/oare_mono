import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import authenticatedRoute from '@/middlewares/router/authenticatedRoute';

/**
 * Restricts access to the route to only authenticated users with admin privileges.
 * Functions as a router-level middleware that can be applied in the route definition.
 * 403 Forbidden Error is sent to the client if the requesting user does not have admin privileges.
 */
async function adminRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const navigateAdmin = (err?: any) => {
      if (err) {
        next(err);
        return;
      }
      const { user } = req;
      if (user && user.isAdmin) {
        next();
      } else {
        next(
          new HttpForbidden('You are not authenticated to access this route')
        );
      }
    };

    // Verifies that the user is authenticated before checking admin status.
    authenticatedRoute(req, res, navigateAdmin);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
}

export default adminRoute;
