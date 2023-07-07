import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /public_denylist', () => {
  const PATH = `${API_PATH}/public_denylist`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockPublicDenylistDao = {
    getDenylist: jest.fn().mockResolvedValue(['test-uuid']),
  };

  const mockResourceDao = {
    getS3ImageByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue({}),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('TextDao', mockTextDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful public denylist retrieval', async () => {
    const response = await sendRequest();
    expect(mockPublicDenylistDao.getDenylist).toHaveBeenCalledTimes(2);
    expect(mockResourceDao.getS3ImageByUuid).toHaveBeenCalledTimes(1);
    expect(mockTextDao.getTextByUuid).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if public denylist retrieval fails', async () => {
    sl.set('PublicDenylistDao', {
      ...mockPublicDenylistDao,
      getDenylist: jest.fn().mockRejectedValue('Failed to retrieve denylist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /public_denylist', () => {
  const PATH = `${API_PATH}/public_denylist`;

  const mockBodyText = {
    uuids: ['test-uuid'],
    type: 'text',
  };

  const mockBodyImage = {
    uuids: ['test-uuid'],
    type: 'img',
  };

  const mockBodyInvalid = {
    uuids: ['test-uuid'],
    type: 'invalid',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockPublicDenylistDao = {
    addItemsToDenylist: jest.fn().mockResolvedValue(),
  };

  const mockTextDao = {
    textExists: jest.fn().mockResolvedValue(true),
  };

  const mockResourceDao = {
    resourceExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('TextDao', mockTextDao);
    sl.set('ResourceDao', mockResourceDao);
  };

  beforeEach(setup);

  const sendRequest = (body, auth = true) => {
    const req = request(app).post(PATH).send(body);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful public denylist text addition', async () => {
    const response = await sendRequest(mockBodyText);
    expect(mockPublicDenylistDao.addItemsToDenylist).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);
  });

  it('returns 201 on successful public denylist image addition', async () => {
    const response = await sendRequest(mockBodyImage);
    expect(mockPublicDenylistDao.addItemsToDenylist).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);
  });

  it('returns 400 if type is invalid', async () => {
    const response = await sendRequest(mockBodyInvalid);
    expect(response.status).toBe(400);
  });

  it('returns 400 if a text does not exist', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      textExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest(mockBodyText);
    expect(response.status).toBe(400);
  });

  it('returns 400 if an image does not exist', async () => {
    sl.set('ResourceDao', {
      ...mockResourceDao,
      resourceExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest(mockBodyImage);
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(mockBodyText, false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest(mockBodyText);
    expect(response.status).toBe(403);
  });

  it('returns 500 if public denylist addition fails', async () => {
    sl.set('PublicDenylistDao', {
      ...mockPublicDenylistDao,
      addItemsToDenylist: jest
        .fn()
        .mockRejectedValue('Failed to add to denylist'),
    });
    const response = await sendRequest(mockBodyText);
    expect(response.status).toBe(500);
  });
});

describe('DELETE /public_denylist/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/public_denylist/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockPublicDenylistDao = {
    removeItemFromDenylist: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).delete(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 204 on successful public denylist removal', async () => {
    const response = await sendRequest();
    expect(mockPublicDenylistDao.removeItemFromDenylist).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if public denylist removal fails', async () => {
    sl.set('PublicDenylistDao', {
      ...mockPublicDenylistDao,
      removeItemFromDenylist: jest
        .fn()
        .mockRejectedValue('Failed to remove from denylist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
