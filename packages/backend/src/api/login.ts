import express from 'express';
import { LoginRegisterResponse, LoginPayload } from '@oare/types';
import HttpException from '@/exceptions/HttpException';
import * as security from '@/security';
import userDao from './daos/UserDao';

const router = express.Router();

router.route('/login').post(async (req, res, next) => {
  try {
    const { email, password }: LoginPayload = req.body;
    const user = await userDao.getUserByEmail(email);

    if (!user) {
      next(new HttpException(400, `Non existent email: ${email}`));
      return;
    }

    if (security.checkPassword(password, user.passwordHash)) {
      req.user = user;
    } else {
      next(new HttpException(400, 'Invalid credentials'));
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
    next(new HttpException(500, err));
  }
});

export default router;
