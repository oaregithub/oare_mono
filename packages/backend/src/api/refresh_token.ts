import express from 'express';
import { LoginRegisterResponse } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { sendJwtCookie } from '@/security';
import sl from '@/serviceLocator';
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

    const utils = sl.get('utils');
    const token = await RefreshTokenDao.getTokenInfo(refreshToken);
    try {
      utils.validateRefreshToken(req, token);
    } catch (err) {
      next(new HttpBadRequest(err));
      return;
    }

    const user: LoginRegisterResponse | null = await UserDao.getUserByEmail(
      token!.email
    );

    (await sendJwtCookie(token!.ipAddress, res, token!.email)).json(user).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
