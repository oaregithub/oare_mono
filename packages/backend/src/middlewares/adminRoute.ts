import { Request, Response, NextFunction } from 'express'; // eslint-disable-line
import jwt from 'jsonwebtoken';
import HttpException from '../exceptions/HttpException';
import userDao, { User } from '../api/daos/UserDao'; // eslint-disable-line

async function adminRoute(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }
    const auth = req.header('Authorization');
    if (!auth) {
      next(new HttpException(400, 'No authorization given for admin restricted route'));
      return;
    }

    const signingToken = process.env.OARE_JWT_TOKEN;
    if (!signingToken) {
      next(new HttpException(500, 'No signing token found'));
      return;
    }

    const token = auth.split(' ')[1];
    const { email } = jwt.verify(token, signingToken) as User;
    const user = await userDao.getUserByEmail(email);
    if (user.isAdmin) {
      req.user = user;
      next();
    } else {
      next(new HttpException(403, 'You are not authenticated to access this route'));
    }
  } catch (err) {
    next(new HttpException(500, err));
  }
}

export default adminRoute;
