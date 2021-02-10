import express from 'express';
import { ErrorsRow, ErrorsPayload } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { v4 } from 'uuid';
import adminRoute from '../middlewares/adminRoute';

const router = express.Router();

router
  .route('/errors')
  .post(async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');

      const uuid = v4();
      const user = req.user || null;
      const { description, stacktrace, status }: ErrorsPayload = req.body;
      const timestamp = new Date();

      const userUuid = user ? user.uuid : null;

      const insertRow: ErrorsRow = {
        uuid,
        user_uuid: userUuid,
        description,
        stacktrace,
        timestamp,
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
  });

export default router;
