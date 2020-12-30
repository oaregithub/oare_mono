import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('POST /reset_password', () => {
  const PATH = `${API_PATH}/reset_password`;

  const mockUser = {
    firstName: 'User',
    uuid: 'user-uuid',
  };
  const UserDao = {
    getUserByEmail: jest.fn().mockResolvedValue(mockUser),
  };

  const ResetPasswordLinksDao = {
    createResetPasswordLink: jest.fn().mockResolvedValue('reset-link'),
  };

  const sendMail = jest.fn().mockResolvedValue(null);
  const nodemailer = {
    createTransport: jest.fn().mockReturnValue({
      sendMail,
    }),
  };

  const setup = () => {
    sl.set('ResetPasswordLinksDao', ResetPasswordLinksDao);
    sl.set('UserDao', UserDao);
    sl.set('nodemailer', nodemailer);
  };

  const resetEmail = 'resetemail@example.com';

  const sendRequest = () => request(app).post(PATH).send({ email: resetEmail });

  beforeEach(setup);

  it("Doesn't send email if the email does not exist in the user table", async () => {
    sl.set('UserDao', {
      ...UserDao,
      getUserByEmail: jest.fn().mockResolvedValue(null),
    });

    const response = await sendRequest();

    expect(response.status).toBe(200);
    expect(ResetPasswordLinksDao.createResetPasswordLink).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('successfully sends email', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(ResetPasswordLinksDao.createResetPasswordLink).toHaveBeenCalledWith(mockUser.uuid);
    expect(sendMail).toHaveBeenCalled();
  });

  it('returns 500 if creating link fails', async () => {
    sl.set('ResetPasswordLinksDao', {
      createResetPasswordLink: jest.fn().mockRejectedValue('Failed to create password link'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns 500 if user dao fails', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockRejectedValue('Failed to get user by email'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
    expect(ResetPasswordLinksDao.createResetPasswordLink).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns 500 if sending mail fails', async () => {
    sl.set('nodemailer', {
      createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockRejectedValue('Failed to send email'),
      }),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
