import * as nodemailer from 'nodemailer';
import mailgun from 'mailgun-js';

const mailer = {
  sendMail: async ({ to, subject, text }: { to: string; subject: string; text: string }) => {
    if (process.env.NODE_ENV === 'production' && process.env.MG_API_KEY) {
      const mg = mailgun({
        apiKey: process.env.MG_API_KEY,
        domain: 'oare.byu.edu',
      });

      const data = {
        from: 'OARE Support',
        to,
        subject,
        text,
      };

      await mg.messages().send(data);
    } else {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.RESET_EMAIL,
          pass: process.env.RESET_EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.RESET_EMAIL,
        to,
        subject,
        text,
      });
    }
  },
};

export default mailer;
