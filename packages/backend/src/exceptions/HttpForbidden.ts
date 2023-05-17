import HttpException from './HttpException';

class HttpForbidden extends HttpException {
  /**
   * Used to indicate that the user is making a forbidden request.
   * Usually used when the user is requesting an admin-only or permission-restricted route that they do not have access to.
   * @param message Error message.
   */
  constructor(message: string) {
    super(403, message, true);
  }
}

export default HttpForbidden;
