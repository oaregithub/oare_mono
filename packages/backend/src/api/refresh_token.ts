import express from 'express';
import RefreshTokenDao from './daos/RefreshTokenDao';
import UserDao from './daos/UserDao';
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

    if (Date.now() >= token.expiration.getTime()) {
      next(new HttpException(400, 'Refresh token is expired'));
      return;
    }

    const user = await UserDao.getUserByEmail(token.email);
    (await sendJwtCookie(token.ipAddress, res, token.email))
      .json({
        id: user.id,
        firstName: user.firstName,
        last_name: user.lastName,
        email: user.email,
        is_admin: !!user.isAdmin,
      })
      .end();
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
