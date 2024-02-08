import HttpException from './HttpException';

class HttpBadRequest extends HttpException {
  /**
   * Used to indicate that the request was malformed or contains invalid data.
   * @param message Error message.
   * @param preventLog Prevents logging of the error if true. Optional.
   */
  constructor(message: string, preventLog?: boolean) {
    super(400, message, preventLog);
  }
}

export default HttpBadRequest;
