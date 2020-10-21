import express from 'express';
import { Group, CreateGroupPayload, DeleteGroupPayload } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import oareGroupDao from './daos/OareGroupDao';

const router = express.Router();

router.route('/groups/:id').get(adminRoute, async (req, res, next) => {
  try {
    const groupId = (req.params.id as unknown) as number;

    const existingGroup = await oareGroupDao.getGroupById(groupId);
    if (!existingGroup) {
      next(new HttpBadRequest(`Cannot retrieve information on non existent group with ID ${groupId}`));
      return;
    }

    res.json(existingGroup);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/groups')
  .get(adminRoute, async (_req, res, next) => {
    try {
      const groups: Group[] = await oareGroupDao.getAllGroups();
      res.json(groups);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupName }: CreateGroupPayload = req.body;

      const existingGroup = await oareGroupDao.getGroupByName(groupName);
      if (existingGroup) {
        next(new HttpBadRequest('Group name already exists'));
        return;
      }

      const groupId = await oareGroupDao.createGroup(groupName);
      res.json({
        id: groupId,
      });
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      // Verify that each group ID exists before deleting
      const { groupIds } = (req.query as unknown) as DeleteGroupPayload;

      for (let i = 0; i < groupIds.length; i += 1) {
        const existingGroup = await oareGroupDao.getGroupById(groupIds[i]);
        if (!existingGroup) {
          next(new HttpBadRequest(`Group with ID ${groupIds[i]} does not exist`));
          return;
        }
      }
      await oareGroupDao.deleteGroups(groupIds);
      res.end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
