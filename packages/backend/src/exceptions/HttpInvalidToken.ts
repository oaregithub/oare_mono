import HttpException from './HttpException';

class HttpInvalidToken extends HttpException {
  /**
   * Used to indicate that the authentication token is invalid.
   * Usually a result of the token being expired. The client will reattempt the request with a new token upon receiving this error.
   */
  constructor() {
    super(407, 'Invalid Authentication Token', true);
  }
}

export default HttpInvalidToken;
