import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { ResetPasswordPayload } from '@oare/types';

const router = express.Router();

router
  .route('/reset_password')
  .post(async (req, res, next) => {
    try {
      const { email }: { email: string } = req.body;

      // Make sure the email exists
      const UserDao = sl.get('UserDao');
      const user = await UserDao.getUserByEmail(email);

      if (!user) {
        // We always return 200 because we wouldn't want attackers
        // to know if they have found a valid email or not
        res.status(200).end();
        return;
      }

      const ResetPasswordLinksDao = sl.get('ResetPasswordLinksDao');
      const resetUuid = await ResetPasswordLinksDao.createResetPasswordLink(user.uuid);

      const mailer = sl.get('mailer');

      await mailer.sendMail({
        to: email,
        subject: 'Reset OARE password',
        text: `Hello ${user.firstName},\n\nYou have requested to reset your password at oare.byu.edu. Please follow this link to reset your password: https://oare.byu.edu/reset_password/${resetUuid}.\n\nOARE Team`,
      });
      res.status(200).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(async (req, res, next) => {
    try {
      const { newPassword, resetUuid }: ResetPasswordPayload = req.body;
      const ResetPasswordLinksDao = sl.get('ResetPasswordLinksDao');

      const resetRow = await ResetPasswordLinksDao.getResetPasswordRow(resetUuid);

      if (!resetRow) {
        next(new HttpBadRequest('Invalid link'));
        return;
      }

      if (Date.now() >= resetRow.expiration.getTime()) {
        next(new HttpBadRequest('Expired reset password link'));
        return;
      }

      const UserDao = sl.get('UserDao');
      const user = await UserDao.getUserByUuid(resetRow.userUuid);

      if (!user) {
        next(new HttpBadRequest('Invalid user ID'));
        return;
      }

      await UserDao.updatePassword(resetRow.uuid, newPassword);

      const mailer = sl.get('mailer');

      await mailer.sendMail({
        to: user.email,
        subject: 'Your OARE password has been reset',
        text: `Hello ${user.firstName},\n\nYour password has been reset for oare.byu.edu. If you did not do this, then immediately contact us at oarefeedback@byu.edu as it could pose a security risk.\n\nOARE Team`,
      });
      res.status(200).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
