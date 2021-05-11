import HttpException from './HttpException';

class HttpInternalError extends HttpException {
  constructor(message: string, preventLog?: boolean) {
    super(500, message, preventLog);
  }
}

export default HttpInternalError;
