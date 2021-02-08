import { Request, Response, NextFunction } from 'express';
import HttpException from '@/exceptions/HttpException';

function errorMiddleware(
  error: HttpException,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';

  if (process.env.NODE_ENV !== 'test') {
    console.log(message); // eslint-disable-line no-console
  }
  response.status(status).send({
    status,
    message,
  });
}

export default errorMiddleware;
