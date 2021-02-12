import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockGET = [
  {
    uuid: 'uuid1',
    name: 'Test1',
    canRead: false,
    canWrite: false,
    hasEpigraphy: true,
  },
  {
    uuid: 'uuid2',
    name: 'Test2',
    canRead: false,
    canWrite: false,
    hasEpigraphy: true,
  },
];
const mockPOST = {
  items: [
    {
      uuid: 'uuid3',
      type: 'text',
    },
    {
      uuid: 'uuid4',
      type: 'text',
    },
  ],
};

describe('GET /public_blacklist', () => {
  const PATH = `${API_PATH}/public_blacklist`;
  const mockPublicBlacklistDao = {
    getBlacklistedTexts: jest.fn().mockResolvedValue(mockGET),
    getBlacklistedCollections: jest.fn().mockResolvedValue([]),
  };
  const mockTextEpigraphyDao = {
    hasEpigraphy: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('PublicBlacklistDao', mockPublicBlacklistDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('returns 200 on successful blacklist retrieval', async () => {
    const response = await sendRequest();
    expect(mockPublicBlacklistDao.getBlacklistedTexts).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockGET);
  });

  it('does not allow non-admin user to see blacklist', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPublicBlacklistDao.getBlacklistedTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in user to see blacklist', async () => {
    const response = await request(app).get(PATH);
    expect(mockPublicBlacklistDao.getBlacklistedTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed blacklist retrieval', async () => {
    sl.set('PublicBlacklistDao', {
      getBlacklistedTexts: jest
        .fn()
        .mockRejectedValue('Remove blacklist text failed'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /public_blacklist', () => {
  const PATH = `${API_PATH}/public_blacklist`;
  const mockPublicBlacklistDao = {
    getBlacklistedTexts: jest.fn().mockResolvedValue(mockGET),
    getBlacklistedCollections: jest.fn().mockResolvedValue([]),
    addPublicTexts: jest.fn().mockResolvedValue(),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('PublicBlacklistDao', mockPublicBlacklistDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPOST).set('Cookie', 'jwt=token');

  it('returns 201 on successful addition', async () => {
    const response = await sendRequest();
    expect(mockPublicBlacklistDao.addPublicTexts).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('does not allow non-admins to update blacklist', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPublicBlacklistDao.addPublicTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to update blacklist', async () => {
    const response = await request(app).get(PATH).send(mockPOST);
    expect(mockPublicBlacklistDao.addPublicTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed add', async () => {
    sl.set('PublicBlacklistDao', {
      ...mockPublicBlacklistDao,
      addPublicTexts: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 when texts are already blacklisted', async () => {
    const mockExistingPOST = {
      items: [
        {
          uuid: 'uuid1',
          type: 'text',
        },
        {
          uuid: 'uuid2',
          type: 'text',
        },
      ],
    };
    const response = await request(app)
      .post(PATH)
      .send(mockExistingPOST)
      .set('Cookie', 'jwt=token');
    expect(mockPublicBlacklistDao.addPublicTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});

describe('DELETE /public_blacklist', () => {
  const uuid = 'uuid1';
  const PATH = `${API_PATH}/public_blacklist/${uuid}`;
  const mockPublicBlacklistDao = {
    getBlacklistedTexts: jest.fn().mockResolvedValue(mockGET),
    getBlacklistedCollections: jest.fn().mockResolvedValue([]),
    removePublicTexts: jest.fn().mockResolvedValue(),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('PublicBlacklistDao', mockPublicBlacklistDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Cookie', 'jwt=token');

  it('returns 200 on successful deletion', async () => {
    const response = await sendRequest();
    expect(mockPublicBlacklistDao.removePublicTexts).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('does not allow non-admins to delete from blacklist', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPublicBlacklistDao.removePublicTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to delete from blacklist', async () => {
    const response = await request(app).delete(PATH);
    expect(mockPublicBlacklistDao.removePublicTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed delete', async () => {
    sl.set('PublicBlacklistDao', {
      ...mockPublicBlacklistDao,
      removePublicTexts: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 when texts to be deleted are not blacklisted', async () => {
    const response = await request(app)
      .delete(`${API_PATH}/public_blacklist/uuid3`)
      .set('Cookie', 'jwt=token');
    expect(mockPublicBlacklistDao.removePublicTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});
