import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /group_allowlist/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/group_allowlist/${groupId}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockGroupAllowlistDao = {
    getGroupAllowlist: jest.fn().mockResolvedValue([]),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('GroupAllowlistDao', mockGroupAllowlistDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful allowlist retrieval', async () => {
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.getGroupAllowlist).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed allowlist retrieval', async () => {
    sl.set('GroupAllowlistDao', {
      getGroupAllowlist: jest
        .fn()
        .mockRejectedValue('Error retrieving allowlist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /group_allowlist/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/group_allowlist/${groupId}`;

  const mockBody = {
    uuids: ['uuid1', 'uuid2'],
    type: 'text',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockGroupAllowlistDao = {
    addItemsToAllowlist: jest.fn().mockResolvedValue(),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const mockTextDao = {
    textExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('GroupAllowlistDao', mockGroupAllowlistDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('TextDao', mockTextDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockBody).set('Authorization', 'token');

  it('returns 201 on successful allowlist addition', async () => {
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.addItemsToAllowlist).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if text does not exist', async () => {
    sl.set('TextDao', {
      textExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 500 on failed allowlist addition', async () => {
    sl.set('GroupAllowlistDao', {
      addItemsToAllowlist: jest
        .fn()
        .mockRejectedValue('Error adding to allowlist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /group_allowlist/:groupId/:uuid', () => {
  const groupId = 1;
  const uuid = 'uuid';
  const PATH = `${API_PATH}/group_allowlist/${groupId}/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockGroupAllowlistDao = {
    containsAssociation: jest.fn().mockResolvedValue(true),
    removeItemFromAllowlist: jest.fn().mockResolvedValue(),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('GroupAllowlistDao', mockGroupAllowlistDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful allowlist removal', async () => {
    const response = await sendRequest();
    expect(mockGroupAllowlistDao.removeItemFromAllowlist).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if association does not exist', async () => {
    sl.set('GroupAllowlistDao', {
      containsAssociation: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 500 on failed allowlist removal', async () => {
    sl.set('GroupAllowlistDao', {
      removeItemFromAllowlist: jest
        .fn()
        .mockRejectedValue('Error removing from allowlist'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
