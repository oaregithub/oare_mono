import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpUnauthorized } from '@/exceptions';

/**
 * Restricts access to the route to only authenticated users.
 * Functions as a router-level middleware that can be applied in the route definition.
 * 401 Unauthorized Error is sent to the client if the requesting user is not authenticated.
 */
async function authenticatedRoute(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const { user } = req;
    if (!user) {
      next(new HttpUnauthorized('You must be logged in to access this route'));
      return;
    }

    next();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
}

export default authenticatedRoute;
