import express from 'express';
import * as security from '../security';
import userDao from './daos/UserDao';
import HttpException from '../exceptions/HttpException';

const router = express.Router();

router.route('/register').post(async (req, res, next) => {
  try {
    const { first_name: firstName, last_name: lastName, email, password } = req.body;
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

    cookieRes.status(201).json({
      data: {
        id: user.id,
        firstName: user.firstName,
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
