import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

// Attach user object to each request
async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    const UserDao = sl.get('UserDao');
    const token = req.cookies.jwt;

    if (!token) {
      req.user = null;
      next();
      return;
    }

    const { email } = jwt.verify(
      token,
      process.env.OARE_JWT_TOKEN || ''
    ) as User;
    const user = await UserDao.getUserByEmail(email);
    req.user = user;
    next();
  } catch (err) {
    next(new HttpInternalError(err));
  }
}

export default attachUser;
