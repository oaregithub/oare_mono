import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { SendMailOptions } from 'nodemailer';

const router = express.Router();

router.route('/reset_password').post(async (req, res, next) => {
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

    const nodemailer = sl.get('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.RESET_EMAIL,
        pass: process.env.RESET_EMAIL_PASSWORD,
      },
    });

    const options: SendMailOptions = {
      from: process.env.RESET_EMAIL,
      to: email,
      subject: 'Reset OARE password',
      text: `Hello ${user.firstName},\n\nYou have requested to reset your password at oare.byu.edu. Please follow this link to reset your password: https://oare.byu.edu/reset_password/${resetUuid}.\n\nOARE Team`,
    };

    await transporter.sendMail(options);
    res.status(200).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
