import HttpException from './HttpException';

class HttpInternalError extends HttpException {
  /**
   * Used to indicate that an internal server error occurred.
   * @param message Error message.
   * @param preventLog Prevents logging of the error if true. Optional.
   */
  constructor(message: string, preventLog?: boolean) {
    super(500, message, preventLog);
  }
}

export default HttpInternalError;
