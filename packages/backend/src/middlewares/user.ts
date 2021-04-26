import { Request, Response, NextFunction } from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import firebase from '@/firebase';

// Attach user object to each request
async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    const UserDao = sl.get('UserDao');
    const idToken = req.headers.authorization;

    if (!idToken) {
      req.user = null;
      next();
      return;
    }

    const decodedToken = await firebase.auth().verifyIdToken(idToken);
    const user = await UserDao.getUserByUuid(decodedToken.uid);

    req.user = user;
    next();
  } catch (err) {
    next(new HttpInternalError(err));
  }
}

export default attachUser;
