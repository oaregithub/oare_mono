import { Request, Response, NextFunction } from 'express';
import { HttpUnauthorized } from '@/exceptions';

/**
 * This middleware guards routes that do not require a logged-in user,
 * but will behave differently if the user is logged in. For example,
 * the Collections page will show different collections if the user
 * is logged in and has more viewing permissions than the public.
 * If a refresh token is provided (meaning the JWT expired), then
 * the route throws a 401 to force the frontend to refresh and then
 * call the route again.
 */
const authFirst = async (req: Request, _res: Response, next: NextFunction) => {
  if (req.user) {
    next();
    return;
  }

  const { refreshToken } = req.cookies;
  if (refreshToken) {
    next(new HttpUnauthorized('Refresh first'));
  } else {
    next();
  }
};

export default authFirst;
