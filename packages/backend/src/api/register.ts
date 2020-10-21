import express from 'express';
import { RegisterPayload, LoginRegisterResponse } from '@oare/types';
import * as security from '@/security';
import HttpException from '@/exceptions/HttpException';
import userDao from './daos/UserDao';

const router = express.Router();

router.route('/register').post(async (req, res, next) => {
  try {
    const { firstName, lastName, email, password }: RegisterPayload = req.body;
    const existingUser = await userDao.emailExists(email);
    if (existingUser) {
      next(new HttpException(400, `The email ${email} is already in use, please choose another.`));
      return;
    }

    const passwordHash = security.hashPassword(password);
    await userDao.createUser({
      firstName,
      lastName,
      email,
      passwordHash,
      isAdmin: false,
    });
    const user = await userDao.getUserByEmail(email);
    req.user = user;

    const cookieRes = await security.sendJwtCookie(req.ip, res, user.email);

    const response: LoginRegisterResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: !!user.isAdmin,
    };

    cookieRes.status(201).json(response);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
