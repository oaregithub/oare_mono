import express from 'express';
import { ErrorsRow, ErrorsPayload } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { v4 } from 'uuid';

const router = express.Router();

router.route('/errors').post(async (req, res, next) => {
  try {
    const ErrorsDao = sl.get('ErrorsDao');

    const uuid = v4();
    const user = req.user || null;
    const { description, stacktrace, status }: ErrorsPayload = req.body;
    const timestamp = new Date();

    let userUuid;
    if (user) {
      userUuid = user.uuid;
    } else {
      userUuid = null;
    }

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
});

export default router;
