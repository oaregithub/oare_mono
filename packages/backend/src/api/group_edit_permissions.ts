import express, { text } from 'express';
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
      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest('Group does not exist'));
        return;
      }

      // Make sure that all texts exist
      const textsExist = await Promise.all(
        uuids.map(uuid => TextDao.textExists(uuid))
      );
      if (!textsExist.includes(false)) {
        next(new HttpBadRequest('One or more texts do not exist'));
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
      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
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
