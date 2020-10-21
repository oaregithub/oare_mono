import { Request, Response, NextFunction } from 'express';
import HttpException from '@/exceptions/HttpException';
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
        next(new HttpException(403, 'You are not authenticated to access this route'));
      }
    };

    authenticatedRoute(req, res, navigateAdmin);
  } catch (err) {
    next(new HttpException(500, err));
  }
}

export default adminRoute;
