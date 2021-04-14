import HttpException from './HttpException';

class HttpForbidden extends HttpException {
  constructor(message: string) {
    super(403, message, true);
  }
}

export default HttpForbidden;
