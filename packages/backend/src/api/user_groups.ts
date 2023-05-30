import express from 'express';
import {
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
} from '@oare/types';
import adminRoute from '@/middlewares/router/adminRoute';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/user_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');
      const UserDao = sl.get('UserDao');

      const groupId = Number(req.params.groupId);

      const group = await OareGroupDao.getGroupById(groupId);
      if (!group) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      const userUuids = await UserGroupDao.getUsersInGroup(groupId);
      const users = await Promise.all(
        userUuids.map(uuid => UserDao.getUserByUuid(uuid))
      );

      // FIXME Filtering out here is dependent on how I adjust the getUserByUuid function for handling non existents
      res.json(users.filter(user => !!user));
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');

      const groupId = Number(req.params.groupId);
      const { userUuids }: AddUsersToGroupPayload = req.body;

      // Make sure that the group ID exists
      const group = await OareGroupDao.getGroupById(groupId);
      if (!group) {
        next(new HttpBadRequest(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure users are not already in group
      const userInGroup = await Promise.all(
        // FIXME can probably do this in a way that doesn't require this DAO function
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

      const groupId = Number(req.params.groupId);
      const { userUuids }: RemoveUsersFromGroupPayload = req.query as any;

      // Make sure that the group ID exists
      const group = await OareGroupDao.getGroupById(groupId);
      if (!group) {
        next(new HttpInternalError(`Group ID ${groupId} does not exist`));
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
