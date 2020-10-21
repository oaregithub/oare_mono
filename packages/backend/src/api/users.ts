import express from 'express';
import adminRoute from '@/middlewares/adminRoute';
import { HttpInternalError } from '@/exceptions';
import userDao from './daos/UserDao';

const router = express.Router();

router.route('/users').get(adminRoute, async (_req, res, next) => {
  try {
    const users = await userDao.getAllUsers();
    res.json(users);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
