import express from 'express';
import * as nodemailer from 'nodemailer';
import { HttpInternalError } from '@/exceptions';

const router = express.Router();

router.route('/send_reset_password_link').post(async (req, res, next) => {
  try {
    const { email }: { email: string } = req.body;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.RESET_EMAIL,
        pass: process.env.RESET_EMAIL_PASSWORD,
      },
    });

    const options = {
      from: process.env.RESET_EMAIL,
      to: email,
      subject: 'Reset OARE password',
      text: 'You have requested to rest your password at oare.byu.edu. ',
    };

    await transporter.sendMail(options);
    res.send('success');
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
