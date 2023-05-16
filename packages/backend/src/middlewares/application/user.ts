import { Request, Response, NextFunction } from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import firebase from '@/firebase';
import HttpException from '@/exceptions/HttpException';

/**
 * Attaches the requesting user to the request object.
 * Functions as an application-level middleware that attaches the user to the every request object.
 * Uses Firebase to verify the user's token and retrieve the requesting user's information.
 */
async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const UserDao = sl.get('UserDao');
    const idToken = req.headers.authorization;

    if (!idToken) {
      req.user = null;
      next();
    } else {
      let decodedToken: firebase.auth.DecodedIdToken;

      try {
        decodedToken = await firebase.auth().verifyIdToken(idToken);
      } catch (err) {
        // If the token is invalid, it sends a 407 error. This often occurs when the token is expired.
        // Upon receiving this response, the frontend will request a new token and retry the request.
        next(new HttpException(407, 'Invalid Firebase token', true));
        return;
      }
      const user = await UserDao.getUserByUuid(decodedToken.uid);

      req.user = user;
      next();
    }
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
}

export default attachUser;
