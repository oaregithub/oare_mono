import HttpException from './HttpException';

class HttpUnauthorized extends HttpException {
  /**
   * Used to indicate that the user is making an unauthorized request.
   * Usually used when an unauthenticated user is requesting a route that requires authentication.
   * @param message Error message.
   */
  constructor(message: string) {
    super(401, message, true);
  }
}

export default HttpUnauthorized;
