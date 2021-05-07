import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockCacheStatusDao = {
  cacheIsEnabled: jest.fn().mockResolvedValue(true),
  enableCache: jest.fn().mockResolvedValue(),
  disableCache: jest.fn().mockResolvedValue(),
};

describe('GET /cache', () => {
  const PATH = `${API_PATH}/cache`;

  const setup = () => {
    sl.set('CacheStatusDao', mockCacheStatusDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful cache status retrieval', async () => {
    const response = await sendRequest();
    expect(mockCacheStatusDao.cacheIsEnabled).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed cache status retrieval', async () => {
    sl.set('CacheStatusDao', {
      ...mockCacheStatusDao,
      cacheIsEnabled: jest
        .fn()
        .mockRejectedValue('failed to retrieve cache status'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /cache/enable', () => {
  const PATH = `${API_PATH}/cache/enable`;

  const setup = () => {
    sl.set('CacheStatusDao', mockCacheStatusDao);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).set('Authorization', 'token');

  it('successfully enables cache', async () => {
    const response = await sendRequest();
    expect(mockCacheStatusDao.enableCache).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed cache enable', async () => {
    sl.set('CacheStatusDao', {
      ...mockCacheStatusDao,
      enableCache: jest.fn().mockRejectedValue('failed to enable cache'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged-in users to enable cache', async () => {
    const response = await request(app).patch(PATH);
    expect(mockCacheStatusDao.enableCache).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to enable cache', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockCacheStatusDao.enableCache).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('PATCH /cache/disable', () => {
  const PATH = `${API_PATH}/cache/disable`;

  const setup = () => {
    sl.set('CacheStatusDao', mockCacheStatusDao);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).set('Authorization', 'token');

  it('successfully disables cache', async () => {
    const response = await sendRequest();
    expect(mockCacheStatusDao.disableCache).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed cache disable', async () => {
    sl.set('CacheStatusDao', {
      ...mockCacheStatusDao,
      disableCache: jest.fn().mockRejectedValue('failed to disable cache'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged-in users to disable cache', async () => {
    const response = await request(app).patch(PATH);
    expect(mockCacheStatusDao.disableCache).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to disable cache', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockCacheStatusDao.disableCache).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
