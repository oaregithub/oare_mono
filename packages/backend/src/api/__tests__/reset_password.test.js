import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import { DateTime } from 'luxon';

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
  const mailer = {
    sendMail,
  };

  const setup = () => {
    sl.set('ResetPasswordLinksDao', ResetPasswordLinksDao);
    sl.set('UserDao', UserDao);
    sl.set('mailer', mailer);
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
    sl.set('mailer', {
      sendMail: jest.fn().mockRejectedValue('Failed to send email'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /reset_password', () => {
  const PATH = `${API_PATH}/reset_password`;
  const payload = {
    newPassword: 'password',
    resetUuid: 'reset-uuid',
  };

  const resetRow = {
    uuid: 'uuid',
    userUuid: 'user-uuid',
    expiration: DateTime.local().plus({ minutes: 30 }).toJSDate(),
  };

  const ResetPasswordLinksDao = {
    getResetPasswordRow: jest.fn().mockResolvedValue(resetRow),
  };

  const UserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      email: 'user@email.com',
      firstName: 'User',
    }),
    updatePassword: jest.fn().mockResolvedValue(null),
  };

  const mailer = {
    sendMail: jest.fn().mockResolvedValue(null),
  };

  const setup = () => {
    sl.set('ResetPasswordLinksDao', ResetPasswordLinksDao);
    sl.set('UserDao', UserDao);
    sl.set('mailer', mailer);
  };

  const sendRequest = () => request(app).patch(PATH).send(payload);

  beforeEach(setup);

  it('successfully resets password', async () => {
    const response = await sendRequest();

    expect(response.status).toBe(200);
    expect(UserDao.updatePassword).toHaveBeenCalledWith(resetRow.uuid, payload.newPassword);
    expect(mailer.sendMail).toHaveBeenCalled();
  });

  it('returns 400 if the link is invalid', async () => {
    sl.set('ResetPasswordLinksDao', {
      ...ResetPasswordLinksDao,
      getResetPasswordRow: jest.fn().mockResolvedValue(null),
    });

    const response = await sendRequest();
    expect(response.status).toBe(400);
    expect(UserDao.updatePassword).not.toHaveBeenCalled();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('returns 400 if the link is expired', async () => {
    sl.set('ResetPasswordLinksDao', {
      ...ResetPasswordLinksDao,
      getResetPasswordRow: jest.fn().mockResolvedValue({
        expiration: DateTime.local().minus({ minutes: 1 }).toJSDate(),
      }),
    });

    const response = await sendRequest();
    expect(response.status).toBe(400);
    expect(UserDao.updatePassword).not.toHaveBeenCalled();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('returns 400 if reset row contains invalid user UUID', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue(null),
    });

    const response = await sendRequest();
    expect(response.status).toBe(400);
    expect(UserDao.updatePassword).not.toHaveBeenCalled();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('returns 500 if updating password fails', async () => {
    sl.set('UserDao', {
      ...UserDao,
      updatePassword: jest.fn().mockRejectedValue('Failed to update password'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('returns 500 if sending mail fails', async () => {
    sl.set('mailer', {
      sendMail: jest.fn().mockRejectedValue('Failed to send mail'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
