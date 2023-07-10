import express from 'express';
import {
  ErrorStatus,
  LogErrorPayload,
  ErrorsSortType,
  UpdateErrorStatusPayload,
} from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';

const router = express.Router();

router
  .route('/errors')
  .get(adminRoute, async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');
      const utils = sl.get('utils');

      const status: ErrorStatus | '' = (req.query.status as string) as
        | ErrorStatus
        | '';
      const user: string = req.query.user as string;
      const description: string = req.query.description as string;
      const stacktrace: string = req.query.stacktrace as string;
      const sort: ErrorsSortType = (req.query.sort as string) as ErrorsSortType;
      const desc: boolean = (req.query.desc as string) === 'true';
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
  .post(async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');

      const userUuid = req.user ? req.user.uuid : null;
      const { description, stacktrace }: LogErrorPayload = req.body;

      await ErrorsDao.logError(userUuid, description, stacktrace, 'New');

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

router.route('/new_errors').get(adminRoute, async (_req, res, next) => {
  try {
    const ErrorsDao = sl.get('ErrorsDao');

    const response = await ErrorsDao.newErrorsExist();

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
