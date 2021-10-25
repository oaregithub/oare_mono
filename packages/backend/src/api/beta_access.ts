import express from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/adminRoute';

const router = express.Router();

router.route('/beta_access/allow').patch(adminRoute, async (req, res, next) => {
  try {
    const UserDao = sl.get('UserDao');
    const userUuid = req.user ? req.user.uuid : null;

    if (!userUuid) {
      next(
        new HttpForbidden(
          'You cannot change the beta access for a non-logged-in user'
        )
      );
      return;
    }
    await UserDao.setBetaAccess(userUuid, true);

    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/beta_access/revoke')
  .patch(adminRoute, async (req, res, next) => {
    try {
      const UserDao = sl.get('UserDao');
      const userUuid = req.user ? req.user.uuid : null;

      if (!userUuid) {
        next(
          new HttpForbidden(
            'You cannot change the beta access for a non-logged-in user'
          )
        );
        return;
      }
      await UserDao.setBetaAccess(userUuid, false);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
