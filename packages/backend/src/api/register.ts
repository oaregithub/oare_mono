import express from 'express';
import { v4 } from 'uuid';
import { RegisterPayload, RegisterResponse } from '@oare/types';
import * as security from '@/security';
import firebase from '@/firebase';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import UserDao from './daos/UserDao';

const router = express.Router();

router.route('/register').post(async (req, res, next) => {
  try {
    const { firstName, lastName, email, password }: RegisterPayload = req.body;
    const existingUser = await UserDao.emailExists(email);
    if (existingUser) {
      next(
        new HttpBadRequest(
          `The email ${email} is already in use, please choose another.`
        )
      );
      return;
    }

    const passwordHash = security.hashPassword(password);

    const uuid = v4();
    await firebase.auth().createUser({
      uid: uuid,
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    await firebase.auth().setCustomUserClaims(uuid, { isAdmin: false });

    await UserDao.createUser({
      uuid,
      firstName,
      lastName,
      email,
      passwordHash,
      isAdmin: false,
    });
    const user = await UserDao.getUserByEmail(email);

    if (!user) {
      next(new HttpInternalError('Error creating user'));
      return;
    }
    req.user = user;

    const firebaseToken = await security.getFirebaseToken(user.uuid);
    const cookieRes = await security.sendJwtCookie(req.ip, res, user.email);

    const response: RegisterResponse = {
      user,
      firebaseToken,
    };

    cookieRes.status(201).json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
