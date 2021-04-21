import express from 'express';
import { LoginPayload } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import * as security from '@/security';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/login').post(async (req, res, next) => {
  try {
    const UserDao = sl.get('UserDao');
    const { email, password }: LoginPayload = req.body;
    const user = await UserDao.getUserByEmail(email);

    if (!user) {
      next(new HttpBadRequest(`Non existent email: ${email}`));
      return;
    }

    const passwordHash = await UserDao.getUserPasswordHash(user.uuid);

    if (security.checkPassword(password, passwordHash)) {
      req.user = user;
    } else {
      next(new HttpBadRequest('Invalid credentials'));
      return;
    }
    const cookieRes = await security.sendJwtCookie(req.ip, res, user);
    cookieRes.json(user);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
