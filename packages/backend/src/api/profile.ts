import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { UpdateProfilePayload } from '@oare/types';
import authenticatedRoute from '@/middlewares/router/authenticatedRoute';

// COMPLETE

const router = express.Router();

router.route('/profile').patch(authenticatedRoute, async (req, res, next) => {
  try {
    const UserDao = sl.get('UserDao');

    const { uuid: userUuid, email, firstName, lastName } = req.user!;
    const updatedProfile: UpdateProfilePayload = req.body;

    await UserDao.updateProfile(userUuid, {
      email: updatedProfile.email || email,
      firstName: updatedProfile.firstName || firstName,
      lastName: updatedProfile.lastName || lastName,
    });

    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
