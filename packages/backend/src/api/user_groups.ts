import express from 'express';
import { AddUsersToGroupPayload, RemoveUsersFromGroupPayload } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import sl from '@/serviceLocator';

async function canInsert(groupId: number, userIds: number[]) {
  for (let i = 0; i < userIds.length; i += 1) {
    const UserGroupDao = sl.get('UserGroupDao');
    const inGroup = await UserGroupDao.userInGroup(groupId, userIds[i]);
    if (inGroup) {
      return false;
    }
  }
  return true;
}

async function canDelete(groupId: number, userIds: number[]) {
  for (let i = 0; i < userIds.length; i += 1) {
    const UserGroupDao = sl.get('UserGroupDao');
    const inGroup = await UserGroupDao.userInGroup(groupId, userIds[i]);

    if (!inGroup) {
      return false;
    }
  }
  return true;
}

const router = express.Router();

router
  .route('/user_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;

      const OareGroupDao = sl.get('OareGroupDao');
      const UserGroupDao = sl.get('UserGroupDao');

      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      res.json(await UserGroupDao.getUsersInGroup(groupId));
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;
      const { userIds }: AddUsersToGroupPayload = req.body;

      const OareGroupDao = sl.get('OareGroupDao');
      const UserDao = sl.get('UserDao');
      const UserGroupDao = sl.get('UserGroupDao');

      // Make sure that the group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure each user ID exists
      for (let i = 0; i < userIds.length; i += 1) {
        const existingUser = await UserDao.getUserById(userIds[i]);
        if (!existingUser) {
          next(new HttpBadRequest(`User ID ${userIds[i]} does not exist`));
          return;
        }
      }

      // Make sure each association does not already exist
      if (!(await canInsert(groupId, userIds))) {
        next(new HttpBadRequest(`One or more of given users already exist in group with ID ${groupId}`));
        return;
      }

      const insertIds = await UserGroupDao.addUsersToGroup(groupId, userIds);
      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;
      const { userIds }: RemoveUsersFromGroupPayload = req.query as any;

      const OareGroupDao = sl.get('OareGroupDao');
      const UserDao = sl.get('UserDao');
      const UserGroupDao = sl.get('UserGroupDao');

      // Make sure that the group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpInternalError(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure each user ID exists
      for (let i = 0; i < userIds.length; i += 1) {
        const existingUser = await UserDao.getUserById(userIds[i]);
        if (!existingUser) {
          next(new HttpInternalError(`User ID ${userIds[i]} does not exist`));
          return;
        }
      }

      // Make sure each user to delete actually belongs to the group
      if (!(await canDelete(groupId, userIds))) {
        next(new HttpBadRequest('Not all given users belong to the given group'));
        return;
      }

      await UserGroupDao.removeUsersFromGroup(groupId, userIds);
      res.end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
