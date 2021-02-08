import mailgun from 'mailgun-js';

const mailer = {
  sendMail: async ({
    to,
    subject,
    text,
  }: {
    to: string;
    subject: string;
    text: string;
  }) => {
    if (process.env.MG_API_KEY) {
      const mg = mailgun({
        apiKey: process.env.MG_API_KEY,
        domain:
          process.env.NODE_ENV === 'production'
            ? 'oare.byu.edu'
            : 'sandbox3f749aa55c7947f5a26959616a7a0054.mailgun.org',
      });

      const data = {
        from: 'OARE Support <oarefeedback@gmail.com>',
        to,
        subject,
        text,
      };

      await mg.messages().send(data);
    }
  },
};

export default mailer;
