import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';
import { UpdatePermissionPayload, PermissionName } from '@oare/types';

const router = express.Router();

router.route('/userpermissions').get(async (req, res, next) => {
  try {
    const userUuid = req.user ? req.user.uuid : null;
    const PermissionsDao = sl.get('PermissionsDao');

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
      const { groupId } = (req.params as unknown) as { groupId: number };
      const PermissionsDao = sl.get('PermissionsDao');

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
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { permission }: UpdatePermissionPayload = req.body;

      const PermissionsDao = sl.get('PermissionsDao');
      await PermissionsDao.addGroupPermission(groupId, permission);
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/permissions/:groupId/:permission')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const { groupId, permission } = (req.params as unknown) as {
        groupId: number;
        permission: PermissionName;
      };
      const PermissionsDao = sl.get('PermissionsDao');
      await PermissionsDao.removePermission(groupId, permission);
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/allpermissions').get(adminRoute, async (_req, res, next) => {
  try {
    const PermissionsDao = sl.get('PermissionsDao');
    const allPermissions = await PermissionsDao.getAllPermissions();
    res.json(allPermissions);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
