import { Request, Response, NextFunction } from 'express';
import { HttpInternalError, HttpUnauthorized } from '@/exceptions';
import sl from '@/serviceLocator';
import firebase from '@/firebase';

// Attach user object to each request
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
        next(new HttpUnauthorized('Invalid firebase token'));
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
