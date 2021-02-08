import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpUnauthorized } from '@/exceptions';

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
    next(new HttpInternalError(err));
  }
}

export default authenticatedRoute;
