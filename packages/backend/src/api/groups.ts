import express from 'express';
import { CreateGroupPayload, UpdateGroupDescriptionPayload } from '@oare/types';
import adminRoute from '@/middlewares/router/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/groups/:id')
  .get(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.id);

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      const group = await OareGroupDao.getGroupById(groupId);

      res.json(group);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.id);

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      await OareGroupDao.deleteGroup(groupId);

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.id);
      const { description }: UpdateGroupDescriptionPayload = req.body;

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest(`Group with ID ${groupId} does not exist`));
        return;
      }

      if (description.length > 200) {
        next(
          new HttpBadRequest('Group description must be 200 characters or less')
        );
        return;
      }

      await OareGroupDao.updateGroupDescription(groupId, description);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/groups')
  .get(adminRoute, async (_req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');

      const groupIds = await OareGroupDao.getAllGroupIds();

      const groups = await Promise.all(
        groupIds.map(id => OareGroupDao.getGroupById(id))
      );

      res.json(groups);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');

      const { name, description }: CreateGroupPayload = req.body;

      const groupNameExists = await OareGroupDao.groupNameExists(name);
      if (groupNameExists) {
        next(new HttpBadRequest('Group name already exists'));
        return;
      }

      const groupId = await OareGroupDao.createGroup(name, description);

      res.status(201).json(groupId);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
