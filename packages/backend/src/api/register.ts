import express from 'express';
import * as security from '../security';
import userDao from './daos/UserDao';
import HttpException from '../exceptions/HttpException';

const router = express.Router();

router.route('/register').post(async (req, res, next) => {
  try {
    const { first_name: firstName, last_name: lastName, email, password } = req.body;
    const existingUser = await userDao.getUserByEmail(email);
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

    const expirationSeconds = 24 * 60 * 60;
    const token = security.createJwt(user.email, expirationSeconds);
    res
      .cookie('jwt', token, {
        secure: process.env.NODE_ENV !== 'development',
        expires: new Date(new Date().getTime() + expirationSeconds * 1000),
      })
      .status(201)
      .json({
        token,
        data: {
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          is_admin: !!user.isAdmin,
        },
      });
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
