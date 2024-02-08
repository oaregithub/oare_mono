import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /user_permissions', () => {
  const PATH = `${API_PATH}/user_permissions`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful user permissions retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 500 when retrieving user permissions fails', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest
        .fn()
        .mockRejectedValue('Failed to retrieve user permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /permissions/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/permissions/${groupId}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockPermissionsDao = {
    getGroupPermissions: jest.fn().mockResolvedValue([]),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful group permissions retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 400 when group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when retrieving group permissions fails', async () => {
    sl.set('PermissionsDao', {
      getGroupPermissions: jest
        .fn()
        .mockRejectedValue('Failed to retrieve group permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /permissions/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/permissions/${groupId}`;

  const mockBody = {
    permission: {
      name: 'test-permission',
      type: 'test-type',
      description: 'test-description',
    },
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockPermissionsDao = {
    addGroupPermission: jest.fn().mockResolvedValue(),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).post(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful group permission addition', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(201);
  });

  it('returns 400 when group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when adding group permission fails', async () => {
    sl.set('PermissionsDao', {
      addGroupPermission: jest
        .fn()
        .mockRejectedValue('Failed to add group permission'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /permissions/:groupId/:permission', () => {
  const groupId = 1;
  const permissionName = 'test-permission';
  const PATH = `${API_PATH}/permissions/${groupId}/${permissionName}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockPermissionsDao = {
    removeGroupPermission: jest.fn().mockResolvedValue(),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).delete(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 204 on successful group permission removal', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(204);
  });

  it('returns 400 when group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when removing group permission fails', async () => {
    sl.set('PermissionsDao', {
      removeGroupPermission: jest
        .fn()
        .mockRejectedValue('Failed to remove group permission'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /all_permissions', () => {
  const PATH = `${API_PATH}/all_permissions`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockPermissionsDao = {
    getAllPermissions: jest.fn().mockReturnValue([]),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful retrieval of all permissions', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });
});
