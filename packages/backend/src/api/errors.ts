import express from 'express';
import { ErrorsPayload, UpdateErrorStatusPayload } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '../middlewares/adminRoute';
import { InsertErrorsRow } from './daos/ErrorsDao';

const router = express.Router();

router
  .route('/errors')
  .post(async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');

      const user = req.user || null;
      const { description, stacktrace, status }: ErrorsPayload = req.body;

      const userUuid = user ? user.uuid : null;

      const insertRow: InsertErrorsRow = {
        userUuid,
        description,
        stacktrace,
        status,
      };

      await ErrorsDao.logError(insertRow);
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .get(adminRoute, async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');
      const utils = sl.get('utils');

      const { page, limit } = utils.extractPagination(req.query);

      const response = await ErrorsDao.getErrorLog(page, limit);
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');
      const { uuid, status }: UpdateErrorStatusPayload = req.body;

      await ErrorsDao.updateErrorStatus(uuid, status);
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
