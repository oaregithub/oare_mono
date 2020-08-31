import { Request, Response, NextFunction } from 'express';  // eslint-disable-line
import HttpException from '../exceptions/HttpException'; // eslint-disable-line

function errorMiddleware(
  error: HttpException,
  request: Request,
  response: Response,
  _next: NextFunction, // eslint-disable-line
) {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  console.log(message);
  response.status(status).send({
    status,
    message,
  });
}

export default errorMiddleware;
