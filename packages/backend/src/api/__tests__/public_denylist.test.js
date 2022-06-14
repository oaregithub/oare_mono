import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockGET = [
  {
    uuid: 'uuid1',
    name: 'test-name',
    hasEpigraphy: true,
  },
  {
    uuid: 'uuid2',
    name: 'test-name',
    hasEpigraphy: true,
  },
];
const mockPOST = {
  uuids: ['uuid3', 'uuid4'],
  type: 'text',
};

describe('GET /public_denylist', () => {
  const PATH = `${API_PATH}/public_denylist`;
  const mockPublicDenylistDao = {
    getDenylistTextUuids: jest.fn().mockResolvedValue(['uuid1', 'uuid2']),
  };
  const mockTextEpigraphyDao = {
    hasEpigraphy: jest.fn().mockResolvedValue(true),
  };
  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue({
      name: 'test-name',
    }),
  };

  const setup = () => {
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('TextDao', mockTextDao);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful denylist retrieval', async () => {
    const response = await sendRequest();
    expect(mockPublicDenylistDao.getDenylistTextUuids).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockGET);
  });

  it('does not allow non-admin user to see denylist', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPublicDenylistDao.getDenylistTextUuids).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in user to see denylist', async () => {
    const response = await request(app).get(PATH);
    expect(mockPublicDenylistDao.getDenylistTextUuids).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed denylist retrieval', async () => {
    sl.set('PublicDenylistDao', {
      getDenylistTextUuids: jest
        .fn()
        .mockRejectedValue('Remove denylist text failed'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /public_denylist', () => {
  const PATH = `${API_PATH}/public_denylist`;
  const mockPublicDenylistDao = {
    getDenylistTextUuids: jest.fn().mockResolvedValue(['uuid1', 'uuid2']),
    getDenylistCollectionUuids: jest.fn().mockResolvedValue([]),
    addItemsToDenylist: jest.fn().mockResolvedValue(),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPOST).set('Authorization', 'token');

  it('returns 201 on successful addition', async () => {
    const response = await sendRequest();
    expect(mockPublicDenylistDao.addItemsToDenylist).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('does not allow non-admins to update denylist', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPublicDenylistDao.addItemsToDenylist).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to update denylist', async () => {
    const response = await request(app).get(PATH).send(mockPOST);
    expect(mockPublicDenylistDao.addItemsToDenylist).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed add', async () => {
    sl.set('PublicDenylistDao', {
      ...mockPublicDenylistDao,
      addItemsToDenylist: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 when texts are already denylisted', async () => {
    const mockExistingPOST = {
      uuids: ['uuid1', 'uuid2'],
      type: 'text',
    };
    const response = await request(app)
      .post(PATH)
      .send(mockExistingPOST)
      .set('Authorization', 'token');
    expect(mockPublicDenylistDao.addItemsToDenylist).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});

describe('DELETE /public_denylist', () => {
  const uuid = 'uuid1';
  const PATH = `${API_PATH}/public_denylist/${uuid}`;
  const mockPublicDenylistDao = {
    getDenylistTextUuids: jest.fn().mockResolvedValue(['uuid1', 'uuid2']),
    getDenylistCollectionUuids: jest.fn().mockResolvedValue([]),
    getDenylistImageUuids: jest.fn().mockResolvedValue([]),
    removeItemFromDenylist: jest.fn().mockResolvedValue(),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful deletion', async () => {
    const response = await sendRequest();
    expect(mockPublicDenylistDao.removeItemFromDenylist).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('does not allow non-admins to delete from denylist', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPublicDenylistDao.removeItemFromDenylist).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to delete from denylist', async () => {
    const response = await request(app).delete(PATH);
    expect(mockPublicDenylistDao.removeItemFromDenylist).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed delete', async () => {
    sl.set('PublicDenylistDao', {
      ...mockPublicDenylistDao,
      removeItemFromDenylist: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 when texts to be deleted are not denylisted', async () => {
    const response = await request(app)
      .delete(`${API_PATH}/public_denylist/uuid3`)
      .set('Authorization', 'token');
    expect(mockPublicDenylistDao.removeItemFromDenylist).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});
