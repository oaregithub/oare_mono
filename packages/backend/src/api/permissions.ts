import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';
import { UpdatePermissionPayload, PermissionName } from '@oare/types';

// VERIFIED COMPLETE

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

      const groupId = Number(req.params.groupId);

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

      const groupId = Number(req.params.groupId);
      const { permission }: UpdatePermissionPayload = req.body;

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

      const groupId = Number(req.params.groupId);
      const permission = req.params.permission as PermissionName;

      await PermissionsDao.removePermission(groupId, permission);

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
