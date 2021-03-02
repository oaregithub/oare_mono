import HttpException from './HttpException';

class HttpUnauthorized extends HttpException {
  constructor(message: string) {
    super(401, message, true);
  }
}

export default HttpUnauthorized;
