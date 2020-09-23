import express from 'express';
import userDao from './daos/UserDao';
import HttpException from '../exceptions/HttpException';
import * as security from '../security';

const router = express.Router();

router.route('/login').post(async (req, res, next) => {
  try {
    const email = String(req.body.email);
    const password = String(req.body.password);
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

    const expirationSeconds = 24 * 60 * 60;
    const token = security.createJwt(user.email, expirationSeconds);

    res
      .cookie('jwt', token, {
        secure: process.env.NODE_ENV !== 'development',
        expires: new Date(new Date().getTime() + expirationSeconds * 1000),
      })
      .json({
        id: user.id,
        firstName: user.firstName,
        last_name: user.lastName,
        email: user.email,
        is_admin: !!user.isAdmin,
      });
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
