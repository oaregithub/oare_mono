import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express'; // eslint-disable-line
import UserDao, { User } from '../api/daos/UserDao'; // eslint-disable-line
import HttpException from '../exceptions/HttpException';

// Attach user object to each request
async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      req.user = null;
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const { email } = jwt.verify(token, process.env.OARE_JWT_TOKEN || '') as User;
    const user = await UserDao.getUserByEmail(email);
    req.user = user;
    next();
  } catch (err) {
    next(new HttpException(500, err));
  }
}

export default attachUser;
