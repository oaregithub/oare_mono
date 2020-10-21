import express from 'express';
import { LoginRegisterResponse, LoginPayload } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import * as security from '@/security';
import userDao from './daos/UserDao';

const router = express.Router();

router.route('/login').post(async (req, res, next) => {
  try {
    const { email, password }: LoginPayload = req.body;
    const user = await userDao.getUserByEmail(email);

    if (!user) {
      next(new HttpBadRequest(`Non existent email: ${email}`));
      return;
    }

    if (security.checkPassword(password, user.passwordHash)) {
      req.user = user;
    } else {
      next(new HttpBadRequest('Invalid credentials'));
      return;
    }

    const cookieRes = await security.sendJwtCookie(req.ip, res, user.email);
    const response: LoginRegisterResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: !!user.isAdmin,
    };
    cookieRes.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
