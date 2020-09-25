import { Request, Response, NextFunction } from 'express';
import HttpException from '../exceptions/HttpException';

async function adminRoute(req: Request, res: Response, next: NextFunction) {
  try {
    // if (process.env.NODE_ENV === 'development') {
    //   next();
    //   return;
    // }

    const { user } = req;
    if (!user) {
      next(new HttpException(401, 'No authorization given for admin restricted route'));
      return;
    }

    if (user.isAdmin) {
      next();
    } else {
      next(new HttpException(403, 'You are not authenticated to access this route'));
    }
  } catch (err) {
    next(new HttpException(500, err));
  }
}

export default adminRoute;
