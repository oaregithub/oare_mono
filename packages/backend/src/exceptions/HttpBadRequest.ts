import HttpException from './HttpException';

class HttpBadRequest extends HttpException {
  constructor(message: string) {
    super(400, message);
  }
}

export default HttpBadRequest;
