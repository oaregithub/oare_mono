import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import authenticatedRoute from './authenticatedRoute';

async function adminRoute(req: Request, res: Response, next: NextFunction) {
  try {
    // if (process.env.NODE_ENV === 'development') {
    //   next();
    //   return;
    // }

    const navigateAdmin = () => {
      const { user } = req;
      if (user && user.isAdmin) {
        next();
      } else {
        next(new HttpForbidden('You are not authenticated to access this route'));
      }
    };

    authenticatedRoute(req, res, navigateAdmin);
  } catch (err) {
    next(new HttpInternalError(err));
  }
}

export default adminRoute;
