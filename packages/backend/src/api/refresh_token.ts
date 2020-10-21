import express from 'express';
import { LoginRegisterResponse } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { sendJwtCookie } from '@/security';
import RefreshTokenDao from './daos/RefreshTokenDao';
import UserDao from './daos/UserDao';

const router = express.Router();

router.route('/refresh_token').get(async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      next(new HttpBadRequest('No refresh token provided'));
      return;
    }

    const token = await RefreshTokenDao.getTokenInfo(refreshToken);
    if (!token) {
      next(new HttpBadRequest('Invalid token'));
      return;
    }

    if (req.ip !== token.ipAddress) {
      next(new HttpBadRequest('Invalid IP address'));
      return;
    }

    if (Date.now() >= token.expiration.getTime()) {
      next(new HttpBadRequest('Refresh token is expired'));
      return;
    }

    const user: LoginRegisterResponse = await UserDao.getUserByEmail(token.email);

    (await sendJwtCookie(token.ipAddress, res, token.email)).json(user).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
