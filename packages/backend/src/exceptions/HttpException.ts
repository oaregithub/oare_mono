/**
 * Abstract class for HTTP exceptions. Used to implement custom exceptions for error handling.
 * @extends Error
 */
abstract class HttpException extends Error {
  status: number;

  message: string;

  preventLog?: boolean;

  /**
   * Creates an instance of HttpException.
   * @param status HTTP status code.
   * @param message Error message.
   * @param preventLog Prevents logging of the error if true. Optional.
   */
  constructor(status: number, message: string, preventLog?: boolean) {
    super(message);
    this.status = status;
    this.message = message;
    this.preventLog = preventLog;
  }
}

export default HttpException;
