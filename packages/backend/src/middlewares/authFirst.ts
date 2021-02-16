import { Request, Response, NextFunction } from 'express';
import { HttpBadRequest } from '@/exceptions';
import RefreshTokenDao from '../api/daos/RefreshTokenDao';
import UserDao from '../api/daos/UserDao';
import utils from '../utils';

const authFirst = async (req: Request, res: Response, next: NextFunction) => {
  const { jwt, refreshToken } = req.cookies;

  if (jwt) {
    next();
    return;
  }

  if (refreshToken) {
    const token = await RefreshTokenDao.getTokenInfo(refreshToken);
    try {
      utils.validateRefreshToken(req, token);
    } catch (err) {
      next(new HttpBadRequest(err));
      return;
    }

    const user = await UserDao.getUserByEmail(token!.email);

    if (!user) {
      next(new HttpBadRequest('User does not exist'));
      return;
    }

    req.user = user;
    next();
  } else {
    next();
  }
};

export default authFirst;
