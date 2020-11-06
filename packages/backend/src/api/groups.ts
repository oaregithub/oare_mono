import express from 'express';
import { Group, CreateGroupPayload, DeleteGroupPayload } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/groups/:id')
  .get(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const groupId = Number(req.params.id);

      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Cannot retrieve information on non existent group with ID ${groupId}`));
        return;
      }

      res.json(existingGroup);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const groupId = Number(req.params.id);

      await OareGroupDao.deleteGroup(groupId);
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/groups')
  .get(adminRoute, async (_req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const groups: Group[] = await OareGroupDao.getAllGroups();
      res.json(groups);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const { groupName }: CreateGroupPayload = req.body;

      const existingGroup = await OareGroupDao.getGroupByName(groupName);
      if (existingGroup) {
        next(new HttpBadRequest('Group name already exists'));
        return;
      }

      const groupId = await OareGroupDao.createGroup(groupName);
      res.json({
        id: groupId,
      });
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
