import HttpException from './HttpException';

class HttpInternalError extends HttpException {
  constructor(message: string) {
    super(500, message);
  }
}

export default HttpInternalError;
