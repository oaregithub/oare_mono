import express from 'express';
import adminRoute from '../middlewares/adminRoute';
import HttpException from '../exceptions/HttpException';
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
  .route('/user_groups')
  .get(adminRoute, async (req, res, next) => {
    try {
      const groupId: number = (req.query.group_id as unknown) as number;

      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpException(400, `Group with ID ${groupId} does not exist`));
        return;
      }

      res.json(await userGroupDao.getUsersInGroup(groupId));
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const groupId = (req.body.group_id as unknown) as number;
      const userIds = (req.body.user_ids as unknown) as number[];

      // Make sure that the group ID exists
      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpException(400, `Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure each user ID exists
      for (let i = 0; i < userIds.length; i += 1) {
        const existingUser = await userDao.getUserById(userIds[i]);
        if (!existingUser) {
          next(new HttpException(400, `User ID ${userIds[i]} does not exist`));
          return;
        }
      }

      // Make sure each association does not already exist
      if (!(await canInsert(groupId, userIds))) {
        next(new HttpException(400, `One or more of given users already exist in group with ID ${groupId}`));
        return;
      }

      const insertIds = await userGroupDao.addUsersToGroup(groupId, userIds);
      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const groupId = (req.query.group_id as unknown) as number;
      const userIds = (req.query.user_ids as unknown) as number[];

      // Make sure that the group ID exists
      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpException(500, `Group ID ${groupId} does not exist`));
        return;
      }

      // Make sure each user ID exists
      for (let i = 0; i < userIds.length; i += 1) {
        const existingUser = await userDao.getUserById(userIds[i]);
        if (!existingUser) {
          next(new HttpException(500, `User ID ${userIds[i]} does not exist`));
          return;
        }
      }

      // Make sure each user to delete actually belongs to the group
      if (!(await canDelete(groupId, userIds))) {
        next(new HttpException(400, 'Not all given users belong to the given group'));
        return;
      }

      await userGroupDao.removeUsersFromGroup(groupId, userIds);
      res.end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  });

export default router;
