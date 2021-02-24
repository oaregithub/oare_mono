import express from 'express';
import {
  ErrorsPayload,
  GetErrorsPayload,
  UpdateErrorStatusPayload,
} from '@oare/types';
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

      const payloadString = (req.query.payload as unknown) as string;
      const payload: GetErrorsPayload = JSON.parse(payloadString);

      const response = await ErrorsDao.getErrorLog(payload);
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const ErrorsDao = sl.get('ErrorsDao');
      const { uuid, status }: UpdateErrorStatusPayload = req.body;

      await ErrorsDao.updateErrorStatus({ uuid, status });
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
