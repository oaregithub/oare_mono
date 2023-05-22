import express from 'express';
import { v4 } from 'uuid';
import { RegisterPayload, RegisterResponse } from '@oare/types';
import * as security from '@/security';
import firebase from '@/firebase';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import sl from '@/serviceLocator';

// VERIFIED COMPLETE

const router = express.Router();

router.route('/register').post(async (req, res, next) => {
  try {
    const UserDao = sl.get('UserDao');

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

    const uuid = v4();
    await firebase.auth().createUser({
      uid: uuid,
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    await UserDao.createUser({
      uuid,
      firstName,
      lastName,
      email,
      isAdmin: false,
    });
    const user = await UserDao.getUserByEmail(email);

    if (!user) {
      next(new HttpInternalError('Error creating user'));
      return;
    }

    req.user = user;

    const firebaseToken = await security.getFirebaseToken(user.uuid);

    const response: RegisterResponse = {
      user,
      firebaseToken,
    };

    res.status(201).json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
