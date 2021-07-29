import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /group_allowlist/:groupId/:type', () => {
  const groupId = 1;
  const type = 'text';
  const PATH = `${API_PATH}/group_allowlist/${groupId}/${type}`;

  const mockTextEpigraphyDao = {
    hasEpigraphy: jest.fn().mockResolvedValue(true),
  };
  const mockGroupAllowlistDao = {
    getGroupAllowlist: jest.fn().mockResolvedValue(['test-uuid']),
  };
  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue('test-name'),
  };
  const mockCollectionDao = {
    getCollectionByUuid: jest.fn().mockResolvedValue('test-name'),
  };

  const setup = () => {
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('GroupAllowlistDao', mockGroupAllowlistDao);
    sl.set('TextDao', mockTextDao);
    sl.set('CollectionDao', mockCollectionDao);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful group allowlist retrieval', async () => {
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.getGroupAllowlist).toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).toHaveBeenCalled();
    expect(mockCollectionDao.getCollectionByUuid).not.toHaveBeenCalled();
    expect(mockTextEpigraphyDao.hasEpigraphy).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('does not allow non-logged-in user to get allowlist', async () => {
    const response = await request(app).get(PATH);
    expect(mockGroupAllowlistDao.getGroupAllowlist).not.toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).not.toHaveBeenCalled();
    expect(mockCollectionDao.getCollectionByUuid).not.toHaveBeenCalled();
    expect(mockTextEpigraphyDao.hasEpigraphy).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to get allowlist', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.getGroupAllowlist).not.toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).not.toHaveBeenCalled();
    expect(mockCollectionDao.getCollectionByUuid).not.toHaveBeenCalled();
    expect(mockTextEpigraphyDao.hasEpigraphy).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed allowlist retreival', async () => {
    sl.set('GroupAllowlistDao', {
      ...mockGroupAllowlistDao,
      getGroupAllowlist: jest
        .fn()
        .mockRejectedValue('failed to get group allowlist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /group_allowlist/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/group_allowlist/${groupId}`;

  const mockPayload = {
    uuids: ['uuid1', 'uuid2'],
    type: 'text',
  };

  const mockGroupAllowlistDao = {
    addItemsToAllowlist: jest.fn().mockResolvedValue(),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(true),
  };
  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue({
      name: 'test-name',
    }),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('GroupAllowlistDao', mockGroupAllowlistDao);
    sl.set('TextDao', mockTextDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPayload).set('Authorization', 'token');

  it('returns 201 on successful allowlist insertion', async () => {
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.addItemsToAllowlist).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.addItemsToAllowlist).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('returns 400 if texts do not exist', async () => {
    sl.set('TextDao', {
      getTextByUuid: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.addItemsToAllowlist).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('does not allow non-logged-in users to add to allowlist', async () => {
    const response = await request(app).post(PATH).send(mockPayload);
    expect(mockGroupAllowlistDao.addItemsToAllowlist).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to add to allowlist', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.addItemsToAllowlist).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed insertion', async () => {
    sl.set('GroupAllowlistDao', {
      ...mockGroupAllowlistDao,
      addItemsToAllowlist: jest
        .fn()
        .mockRejectedValue('failed to add to allowlist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /group_allowlist/:groupId/:uuid', () => {
  const groupId = 1;
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/group_allowlist/${groupId}/${uuid}`;

  const mockGroupAllowlistDao = {
    removeItemFromAllowlist: jest.fn().mockResolvedValue(),
    containsAssociation: jest.fn().mockResolvedValue(true),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(true),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('GroupAllowlistDao', mockGroupAllowlistDao);
    sl.set('OareGroupDao', mockOareGroupDao);
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

  it('returns 204 on successful allowlist deletion', async () => {
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.removeItemFromAllowlist).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(
      mockGroupAllowlistDao.removeItemFromAllowlist
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('returns 400 if no association exists', async () => {
    sl.set('GroupAllowlistDao', {
      ...mockGroupAllowlistDao,
      containsAssociation: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(
      mockGroupAllowlistDao.removeItemFromAllowlist
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('does not allow non-logged-in users to delete from allowlist', async () => {
    const response = await request(app).delete(PATH);
    expect(
      mockGroupAllowlistDao.removeItemFromAllowlist
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to delete from allowlist', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(
      mockGroupAllowlistDao.removeItemFromAllowlist
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed deletion', async () => {
    sl.set('GroupAllowlistDao', {
      ...mockGroupAllowlistDao,
      removeItemFromAllowlist: jest
        .fn()
        .mockRejectedValue('failed to remove from allowlist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
