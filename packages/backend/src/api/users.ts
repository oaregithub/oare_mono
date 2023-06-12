import express from 'express';
import adminRoute from '@/middlewares/router/adminRoute';
import authenticatedRoute from '@/middlewares/router/authenticatedRoute';
import { HttpInternalError, HttpBadRequest, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';
import { User, UserWithGroups } from '@oare/types';

// MOSTLY COMPLETE

const router = express.Router();

router.route('/users').get(adminRoute, async (_req, res, next) => {
  try {
    const UserDao = sl.get('UserDao');
    const UserGroupDao = sl.get('UserGroupDao');

    const userUuids = await UserDao.getAllUserUuids();

    const users = await Promise.all(
      userUuids.map(uuid => UserDao.getUserByUuid(uuid))
    );

    // FIXME groups should be included in User object

    const groups = await Promise.all(
      users.map(user => UserGroupDao.getGroupsOfUser(user.uuid))
    );

    const response: UserWithGroups[] = users.map((user, idx) => ({
      ...user,
      groups: groups[idx],
    }));

    res.json(response);
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

    if (!req.user!.isAdmin && uuid !== req.user!.uuid) {
      next(
        new HttpForbidden(
          `You do not have permission to retrieve information for user with UUID ${uuid}`
        )
      );
      return;
    }

    const user = await UserDao.getUserByUuid(uuid);

    res.json(user);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
