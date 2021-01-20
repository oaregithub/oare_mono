import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/adminRoute';
import { PermissionResponse, UpdatePermissionPayload } from '@oare/types';

const router = express.Router();

router.route('/userpermissions').get(async (req, res, next) => {
  try {
    const { user } = req;
    const PermissionsDao = sl.get('PermissionsDao');

    const permissions = await PermissionsDao.getUserPermissions(user);

    res.json(permissions);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/permissions/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const PermissionsDao = sl.get('PermissionsDao');

      const groupPermissions = await PermissionsDao.getGroupPermissions(groupId);

      res.json(groupPermissions);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { type, permission }: UpdatePermissionPayload = req.body;

      const PermissionsDao = sl.get('PermissionsDao');
      await PermissionsDao.addPermission(groupId, type, permission);
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/permissions/:groupId/:permission').delete(adminRoute, async (req, res, next) => {
  try {
    const { groupId, permission } = (req.params as unknown) as {
      groupId: number;
      permission: PermissionResponse[keyof PermissionResponse][number];
    };
    const PermissionsDao = sl.get('PermissionsDao');
    await PermissionsDao.removePermission(groupId, permission);
    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/permissions').get(adminRoute, async (_req, res, next) => {
  try {
    const PermissionsDao = sl.get('PermissionsDao');
    const allPermissions = await PermissionsDao.getAllPermissions();
    res.json(allPermissions);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
