import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.RESET_EMAIL,
    pass: process.env.RESET_EMAIL_PASSWORD,
  },
});

const mailer = {
  sendMail: ({ to, subject, text }: { to: string; subject: string; text: string }) => {
    transporter.sendMail({
      from: process.env.RESET_EMAIL,
      to,
      subject,
      text,
    });
  },
};

export default mailer;
