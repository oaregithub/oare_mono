import express from 'express';
import {
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
} from '@oare/types';
import adminRoute from '@/middlewares/router/adminRoute';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import sl from '@/serviceLocator';

// COMPLETE

const router = express.Router();

router
  .route('/user_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');
      const UserDao = sl.get('UserDao');

      const groupId = Number(req.params.groupId);

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      const userUuids = await UserGroupDao.getUsersInGroup(groupId);
      const users = await Promise.all(
        userUuids.map(uuid => UserDao.getUserByUuid(uuid))
      );

      res.json(users);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');
      const UserDao = sl.get('UserDao');

      const groupId = Number(req.params.groupId);
      const { userUuids }: AddUsersToGroupPayload = req.body;

      // Make sure that the group ID exists
      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure the users exist
      const usersExist = await Promise.all(
        userUuids.map(uuid => UserDao.userExists(uuid))
      );
      if (usersExist.includes(false)) {
        next(new HttpBadRequest('One or more users do not exist'));
        return;
      }

      // Make sure users are not already in group
      const userInGroup = await Promise.all(
        userUuids.map(uuid => UserGroupDao.userInGroup(groupId, uuid))
      );
      if (userInGroup.some(inGroup => inGroup)) {
        next(
          new HttpBadRequest(
            `One or more of given users already exist in group with ID ${groupId}`
          )
        );
        return;
      }

      await Promise.all(
        userUuids.map(uuid => UserGroupDao.addUserToGroup(groupId, uuid))
      );

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');
      const UserDao = sl.get('UserDao');

      const groupId = Number(req.params.groupId);
      const { userUuids }: RemoveUsersFromGroupPayload = req.query as any;

      // Make sure that the group ID exists
      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure the users exist
      const usersExist = await Promise.all(
        userUuids.map(uuid => UserDao.userExists(uuid))
      );
      if (usersExist.includes(false)) {
        next(new HttpBadRequest('One or more users do not exist'));
        return;
      }

      await Promise.all(
        userUuids.map(uuid => UserGroupDao.removeUserFromGroup(groupId, uuid))
      );
      res.end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
