import express from 'express';
import RefreshTokenDao from './daos/RefreshTokenDao';
import HttpException from '../exceptions/HttpException';
import { sendJwtCookie } from '../security';

const router = express.Router();

router.route('/refresh_token').get(async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      next(new HttpException(400, 'No refresh token provided'));
      return;
    }

    const token = await RefreshTokenDao.getTokenInfo(refreshToken);
    if (!token) {
      next(new HttpException(400, 'Invalid token'));
      return;
    }

    if (req.ip !== token.ipAddress) {
      next(new HttpException(400, 'Invalid IP address'));
      return;
    }

    (await sendJwtCookie(token.ipAddress, res, token.email)).end();
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
