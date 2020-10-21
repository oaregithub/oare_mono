import { Request, Response, NextFunction } from 'express';
import HttpException from '@/exceptions/HttpException';

async function authenticatedRoute(req: Request, _res: Response, next: NextFunction) {
  try {
    const { user } = req;
    if (!user) {
      next(new HttpException(401, 'You must be logged in to access this route'));
      return;
    }

    next();
  } catch (err) {
    next(new HttpException(500, err));
  }
}

export default authenticatedRoute;
