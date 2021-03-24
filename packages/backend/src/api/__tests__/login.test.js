import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import * as security from '@/security';

jest.mock('../../security', () => ({
  __esModule: true,
  checkPassword: jest.fn(),
  sendJwtCookie: jest.fn((_, res) => Promise.resolve(res)),
}));

describe('login test', () => {
  const PATH = `${API_PATH}/login`;
  const user = {
    uuid: 'user-uuid',
  };
  const UserDao = {
    getUserByEmail: jest.fn().mockResolvedValue(user),
    getUserPasswordHash: jest.fn().mockResolvedValue('password-hash'),
  };

  beforeEach(() => {
    security.checkPassword = jest.fn().mockResolvedValue(true);
    sl.set('UserDao', UserDao);
  });

  const sendRequest = () =>
    request(app).post(PATH).send({
      email: 'test@email.com',
      password: 'password-hash',
    });

  it('successfully logs in user', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(user);
    expect(UserDao.getUserByEmail).toHaveBeenCalledWith('test@email.com');
    expect(UserDao.getUserPasswordHash).toHaveBeenCalledWith(user.uuid);
  });

  it('returns 400 when password is incorrect', async () => {
    security.checkPassword = jest.fn().mockReturnValue(false);
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 500 when getting user by email fails', async () => {
    sl.set('UserDao', {
      ...UserDao,
      getUserByEmail: jest
        .fn()
        .mockRejectedValue('could not get user by email'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
    expect(UserDao.getUserPasswordHash).not.toHaveBeenCalled();
  });

  it('returns 500 when getting user password hash fails', async () => {
    sl.set('UserDao', {
      ...UserDao,
      getUserPasswordHash: jest
        .fn()
        .mockRejectedValue('could not get password hash'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
