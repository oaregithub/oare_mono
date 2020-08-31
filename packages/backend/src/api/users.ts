import express from 'express';
import adminRoute from '../middlewares/adminRoute';
import userDao from './daos/UserDao';
import HttpException from '../exceptions/HttpException';

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
