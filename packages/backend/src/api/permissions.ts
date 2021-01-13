import express from 'express';
import { HttpInternalError } from '@/exceptions';
import PermissionsDao from '@/api/daos/PermissionsDao';

const router = express.Router();

router.route('/permissions').get(async (req, res, next) => {
  try {
    const { user } = req;

    const permissions = await PermissionsDao.getUserPermissions(user);

    res.json(permissions);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
