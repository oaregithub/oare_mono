import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /users', () => {
  const PATH = `${API_PATH}/users`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
    getAllUserUuids: jest.fn().mockResolvedValue(['test-user-uuid']),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful user list retrieval', async () => {
    const response = await sendRequest();
    expect(mockUserDao.getAllUserUuids).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not an admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if user list retrieval fails', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getAllUserUuids: jest
        .fn()
        .mockRejectedValue('Failed to retrieve users uuids.'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /users/:uuid', () => {
  const uuid = 'test-user-uuid';
  const PATH = `${API_PATH}/users/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest
      .fn()
      .mockResolvedValue({ uuid: 'test-user-uuid', isAdmin: false }),
    userExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful user retrieval', async () => {
    const response = await sendRequest();
    expect(mockUserDao.getUserByUuid).toHaveBeenCalledWith(uuid);
    expect(response.status).toBe(200);
  });

  it('returns 400 if the user does not exist', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      userExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 403 if requesting user that is not the user itself', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest
        .fn()
        .mockResolvedValue({ uuid: 'other-user-uuid', isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 200 if requesting user that is not the user itself, but requesting user is admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest
        .fn()
        .mockResolvedValue({ uuid: 'other-user-uuid', isAdmin: true }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });
});
