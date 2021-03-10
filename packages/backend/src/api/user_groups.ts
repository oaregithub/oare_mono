import express from 'express';
import {
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
} from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/user_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;

      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');
      const UserDao = sl.get('UserDao');

      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      const userUuids = await UserGroupDao.getUsersInGroup(groupId);
      const users = await Promise.all(
        userUuids.map(uuid => UserDao.getUserByUuid(uuid))
      );
      res.json(users.filter(user => !!user));
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;
      const { userUuids }: AddUsersToGroupPayload = req.body;

      const OareGroupDao = sl.get('OareGroupDao');
      const UserDao = sl.get('UserDao');
      const UserGroupDao = sl.get('UserGroupDao');

      // Make sure that the group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure each user UUID exists
      const users = await Promise.all(
        userUuids.map(uuid => UserDao.getUserByUuid(uuid))
      );
      if (users.some(u => !u)) {
        const badIndex = users.indexOf(null);
        next(
          new HttpBadRequest(`User UUID ${userUuids[badIndex]} does not exist`)
        );
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
      next(new HttpInternalError(err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;
      const { userUuids }: RemoveUsersFromGroupPayload = req.query as any;

      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');

      // Make sure that the group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpInternalError(`Group ID ${groupId} does not exist`));
        return;
      }

      await Promise.all(
        userUuids.map(uuid => UserGroupDao.removeUserFromGroup(groupId, uuid))
      );
      res.end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
