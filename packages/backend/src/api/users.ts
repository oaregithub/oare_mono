import express from 'express';
import adminRoute from '@/middlewares/router/adminRoute';
import authenticatedRoute from '@/middlewares/router/authenticatedRoute';
import { HttpInternalError, HttpBadRequest, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/users').get(adminRoute, async (_req, res, next) => {
  try {
    const UserDao = sl.get('UserDao');
    const users = await UserDao.getAllUsers();
    res.json(users);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/users/:uuid').get(authenticatedRoute, async (req, res, next) => {
  try {
    const UserDao = sl.get('UserDao');
    const { uuid } = req.params;

    const userExists = await UserDao.uuidExists(uuid);

    if (!userExists) {
      next(new HttpBadRequest(`There is no user with UUID ${uuid}`));
      return;
    }

    const user = await UserDao.getUserByUuid(uuid);

    if (!req.user!.isAdmin && uuid !== req.user!.uuid) {
      next(
        new HttpForbidden(
          `You do not have permission to retrieve information for user with UUID ${uuid}`
        )
      );
      return;
    }

    res.json(user);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
