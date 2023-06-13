import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';
import { UpdatePermissionPayload, PermissionName } from '@oare/types';

// COMPLETE

const router = express.Router();

router.route('/user_permissions').get(async (req, res, next) => {
  try {
    const PermissionsDao = sl.get('PermissionsDao');

    const userUuid = req.user ? req.user.uuid : null;

    const permissions = await PermissionsDao.getUserPermissions(userUuid);

    res.json(permissions);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/permissions/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const PermissionsDao = sl.get('PermissionsDao');
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.groupId);

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest('Group does not exist'));
        return;
      }

      const groupPermissions = await PermissionsDao.getGroupPermissions(
        groupId
      );

      res.json(groupPermissions);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const PermissionsDao = sl.get('PermissionsDao');
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.groupId);
      const { permission }: UpdatePermissionPayload = req.body;

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest('Group does not exist'));
        return;
      }

      await PermissionsDao.addGroupPermission(
        groupId,
        permission.type,
        permission.name
      );

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/permissions/:groupId/:permission')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const PermissionsDao = sl.get('PermissionsDao');
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.groupId);
      const permission = req.params.permission as PermissionName;

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest('Group does not exist'));
        return;
      }

      await PermissionsDao.removeGroupPermission(groupId, permission);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/all_permissions').get(adminRoute, async (_req, res, next) => {
  try {
    const PermissionsDao = sl.get('PermissionsDao');

    const allPermissions = PermissionsDao.getAllPermissions();

    res.json(allPermissions);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
