import HttpException from './HttpException';

class HttpBadRequest extends HttpException {
  constructor(message: string, preventLog?: boolean) {
    super(400, message, preventLog);
  }
}

export default HttpBadRequest;
