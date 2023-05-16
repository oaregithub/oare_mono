import { Request, Response, NextFunction } from 'express';
import HttpException from '@/exceptions/HttpException';
import { InsertErrorsRow } from '@/api/daos/ErrorsDao';
import sl from '@/serviceLocator';

/**
 * Handles errors thrown by the Express application.
 * Functions as an application-level middleware that captures all errors.
 */
const errorMiddleware = async (
  error: HttpException,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const ErrorsDao = sl.get('ErrorsDao');
  const status = error.status || 500;
  const message =
    typeof error.message === 'string' ? error.message : String(error);

  // Does not log error if it is marked as preventLog or if the environment is 'test' or 'readonly'
  if (
    !error.preventLog &&
    process.env.NODE_ENV !== 'test' &&
    process.env.DB_SOURCE !== 'readonly'
  ) {
    const userUuid = req.user ? req.user.uuid : null;
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
      // Logs error to console if database logging fails. Does not throw error because this is the error handler.
      console.error('Error logging error', insertRow); // eslint-disable-line no-console
    }
  }

  if (process.env.NODE_ENV !== 'test' || process.env.TEST_LOG === 'on') {
    console.log(message); // eslint-disable-line no-console
  }

  // Sends error response to client.
  // If the user is an admin, it includes the full error message for internal errors.Otherwise, it only includes the status code and a generic message.
  res.status(status).json({
    status,
    message:
      status < 500 || (req.user && req.user.isAdmin)
        ? `${status} Error: ${message}`
        : `${status} Internal Error`,
  });
};

export default errorMiddleware;
