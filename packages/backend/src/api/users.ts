import express from 'express';
import adminRoute from '@/middlewares/adminRoute';
import HttpException from '@/exceptions/HttpException';
import userDao from './daos/UserDao';

const router = express.Router();

router.route('/users').get(adminRoute, async (_req, res, next) => {
  try {
    const users = await userDao.getAllUsers();
    res.json(users);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
