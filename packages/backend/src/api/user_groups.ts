import express from 'express';
import { AddUsersToGroupPayload, RemoveUsersFromGroupPayload } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import oareGroupDao from './daos/OareGroupDao';
import userGroupDao from './daos/UserGroupDao';
import userDao from './daos/UserDao';

async function canInsert(groupId: number, userIds: number[]) {
  for (let i = 0; i < userIds.length; i += 1) {
    const inGroup = await userGroupDao.userInGroup(groupId, userIds[i]);
    if (inGroup) {
      return false;
    }
  }
  return true;
}

async function canDelete(groupId: number, userIds: number[]) {
  for (let i = 0; i < userIds.length; i += 1) {
    const inGroup = await userGroupDao.userInGroup(groupId, userIds[i]);

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

      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      res.json(await userGroupDao.getUsersInGroup(groupId));
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;
      const { userIds }: AddUsersToGroupPayload = req.body;

      // Make sure that the group ID exists
      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure each user ID exists
      for (let i = 0; i < userIds.length; i += 1) {
        const existingUser = await userDao.getUserById(userIds[i]);
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

      const insertIds = await userGroupDao.addUsersToGroup(groupId, userIds);
      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const { groupId }: { groupId: number } = req.params as any;
      const { userIds }: RemoveUsersFromGroupPayload = req.query as any;

      // Make sure that the group ID exists
      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpInternalError(`Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure each user ID exists
      for (let i = 0; i < userIds.length; i += 1) {
        const existingUser = await userDao.getUserById(userIds[i]);
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

      await userGroupDao.removeUsersFromGroup(groupId, userIds);
      res.end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
