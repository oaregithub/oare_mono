import { Request, Response, NextFunction } from 'express';
import HttpException from '@/exceptions/HttpException';
import { InsertErrorsRow } from '@oare/types';
import sl from '../serviceLocator';

const errorMiddleware = async (error: HttpException, request: Request, response: Response, _next: NextFunction) => {
  const ErrorsDao = sl.get('ErrorsDao');
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';

  if (process.env.NODE_ENV !== 'test') {
    const userUuid = request.user ? request.user.uuid : null;
    const stacktrace = error.stack || null;

    const insertRow: InsertErrorsRow = {
      userUuid,
      description: message,
      stacktrace,
      status: 'New',
    };

    await ErrorsDao.logError(insertRow);
    console.log(message);
  }
  response.status(status).send({
    status,
    message,
  });
};

export default errorMiddleware;
