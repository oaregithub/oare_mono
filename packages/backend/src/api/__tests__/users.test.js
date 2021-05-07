import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /users/:uuid', () => {
  const userUuid = 'user-uuid';
  const PATH = `${API_PATH}/users/${userUuid}`;
  const user = {
    uuid: userUuid,
    firstName: 'John',
    lastName: 'Doe',
    isAdmin: false,
  };

  const UserDao = {
    uuidExists: jest.fn().mockResolvedValue(true),
    getUserByUuid: jest.fn().mockResolvedValue(user),
  };

  beforeEach(() => {
    sl.set('UserDao', UserDao);
  });

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns user', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(user);
  });

  it("doesn't allow non-signed-in users to access the endpoint", async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
    expect(UserDao.getUserByUuid).not.toHaveBeenCalled();
  });

  it("doesn't allow a user to access information about another user", async () => {
    sl.set('UserDao', {
      ...UserDao,
      getUserByUuid: jest.fn().mockResolvedValue({
        ...user,
        uuid: 'other-uuid',
      }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('allows admins to access informations about other users', async () => {
    sl.set('UserDao', {
      ...UserDao,
      getUserByUuid: jest.fn().mockResolvedValue({
        ...user,
        isAdmin: true,
        uuid: 'admin-uuid',
      }),
    });

    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 400 when the UUID does not exist', async () => {
    sl.set('UserDao', {
      ...UserDao,
      uuidExists: jest.fn().mockResolvedValue(false),
    });

    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns returns 500 when checking UUID existence fails', async () => {
    sl.set('UserDao', {
      ...UserDao,
      uuidExists: jest.fn().mockRejectedValue('failed to check if UUID exists'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns returns 500 when getting user fails', async () => {
    sl.set('UserDao', {
      ...UserDao,
      getUserByUuid: jest.fn().mockRejectedValue('failed to get user'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
