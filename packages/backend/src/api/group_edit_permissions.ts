import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/router/adminRoute';
import sl from '@/serviceLocator';
import { GroupEditPermissionsPayload } from '@oare/types';

// COMPLETE

const router = express.Router();

router
  .route('/group_edit_permissions/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const GroupEditPermissionsDao = sl.get('GroupEditPermissionsDao');
      const TextDao = sl.get('TextDao');

      const groupId = Number(req.params.groupId);

      const groupEditPermissionTextUuids = await GroupEditPermissionsDao.getGroupEditPermissions(
        groupId
      );

      const texts = await Promise.all(
        groupEditPermissionTextUuids.map(uuid => TextDao.getTextByUuid(uuid))
      );

      res.json(texts);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/group_edit_permissions/:groupId')
  .post(adminRoute, async (req, res, next) => {
    try {
      const groupId = Number(req.params.groupId);
      const { uuids }: GroupEditPermissionsPayload = req.body;

      const GroupEditPermissionsDao = sl.get('GroupEditPermissionsDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const TextDao = sl.get('TextDao');

      // Make sure that group ID exists
      try {
        await OareGroupDao.getGroupById(groupId);
      } catch (err) {
        next(new HttpBadRequest(err as string));
        return;
      }

      // Make sure that all texts exist
      try {
        await Promise.all(uuids.map(uuid => TextDao.getTextByUuid(uuid)));
      } catch (err) {
        next(new HttpBadRequest(err as string));
        return;
      }

      await GroupEditPermissionsDao.addTextsToGroupEditPermissions(
        groupId,
        uuids
      );

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/group_edit_permissions/:groupId/:uuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const GroupEditPermissionsDao = sl.get('GroupEditPermissionsDao');
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.groupId);
      const uuid = req.params.uuid as string;

      // Make sure group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure association exists
      const associationExists = await GroupEditPermissionsDao.containsAssociation(
        uuid,
        groupId
      );
      if (!associationExists) {
        next(new HttpBadRequest(`Cannot remove item not in group ${uuid}`));
        return;
      }

      await GroupEditPermissionsDao.removeTextFromGroupEditPermissions(
        groupId,
        uuid
      );
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
