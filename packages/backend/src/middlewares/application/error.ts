import { Request, Response, NextFunction } from 'express';
import HttpException from '@/exceptions/HttpException';
import { InsertErrorsRow } from '@/api/daos/ErrorsDao';
import sl from '@/serviceLocator';

const errorMiddleware = async (
  error: HttpException,
  request: Request,
  response: Response,
  _next: NextFunction
) => {
  const ErrorsDao = sl.get('ErrorsDao');
  const status = error.status || 500;
  const message =
    typeof error.message === 'string' ? error.message : String(error);

  if (
    !error.preventLog &&
    process.env.NODE_ENV !== 'test' &&
    process.env.DB_SOURCE !== 'readonly'
  ) {
    const userUuid = request.user ? request.user.uuid : null;
    const stacktrace = error.stack || null;

    const insertRow: InsertErrorsRow = {
      userUuid,
      description: message,
      stacktrace,
      status: 'New',
    };

    try {
      await ErrorsDao.logError(insertRow);
    } catch (err) {
      console.error('Error logging error', insertRow); // eslint-disable-line no-console
    }
  }

  if (process.env.NODE_ENV !== 'test' || process.env.TEST_LOG === 'on') {
    console.log(message); // eslint-disable-line no-console
  }

  response.status(status).send({
    status,
    message:
      status < 500 || (request.user && request.user.isAdmin)
        ? `${status} Error: ${message}`
        : `${status} Internal Error`,
  });
};

export default errorMiddleware;
