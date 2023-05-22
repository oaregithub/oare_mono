import express from 'express';
import {
  ErrorStatus,
  ErrorsPayload,
  SortType,
  UpdateErrorStatusPayload,
} from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';

// MOSTLY COMPLETE

const router = express.Router();

router
  .route('/errors')
  .get(adminRoute, async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');
      const utils = sl.get('utils');

      const status: ErrorStatus | '' = (req.query.status as unknown) as
        | ErrorStatus
        | '';
      const user: string = (req.query.user as unknown) as string;
      const description: string = (req.query.description as unknown) as string;
      const stacktrace: string = (req.query.stacktrace as unknown) as string;
      const sort: SortType = (req.query.sort as unknown) as SortType;
      const desc: boolean = (req.query.desc as unknown) === 'true';
      const { page, limit } = utils.extractPagination(req.query);

      const response = await ErrorsDao.getErrorLog(
        status,
        user,
        description,
        stacktrace,
        sort,
        desc,
        page,
        limit
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  // FIXME - can't be admin route but having it open is a risk
  .post(async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');

      const user = req.user || null;
      const userUuid = user ? user.uuid : null;
      const { description, stacktrace, status }: ErrorsPayload = req.body;

      await ErrorsDao.logError(userUuid, description, stacktrace, status);

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');

      const { uuids, status }: UpdateErrorStatusPayload = req.body;

      await Promise.all(
        uuids.map(uuid => ErrorsDao.updateErrorStatus(uuid, status))
      );

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

// FIXME - should probably use websockets rather than polling
router.route('/newerrors').get(adminRoute, async (_req, res, next) => {
  try {
    const ErrorsDao = sl.get('ErrorsDao');

    const response = await ErrorsDao.newErrorsExist();

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
