import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockPermissions = [
  {
    name: 'WORDS',
    type: 'pages',
    description: 'Allow group users to view "Words" tab and access associated pages',
  },
  {
    name: 'NAMES',
    type: 'pages',
    description: 'Allow group users to view "Names" tab and access associated pages',
  },
  {
    name: 'PLACES',
    type: 'pages',
    description: 'Allow group users to view "Places" tab and access associated pages',
  },
  {
    name: 'ADD_TRANSLATION',
    type: 'dictionary',
    description: 'Allow group users to add translations to existing words',
    dependency: 'WORDS',
  },
  {
    name: 'DELETE_TRANSLATION',
    type: 'dictionary',
    description: 'Allow group users to delete existing word translations',
    dependency: 'WORDS',
  },
  {
    name: 'UPDATE_FORM',
    type: 'dictionary',
    description: 'Allow group users to make changes to form(s) of words',
    dependency: 'WORDS',
  },
  {
    name: 'UPDATE_TRANSLATION',
    type: 'dictionary',
    description: 'Allow group users to make changes to translations of existing words',
    dependency: 'WORDS',
  },
  {
    name: 'UPDATE_TRANSLATION_ORDER',
    type: 'dictionary',
    description: 'Allow group users to adjust the order of existing word translations',
    dependency: 'WORDS',
  },
  {
    name: 'UPDATE_WORD_SPELLING',
    type: 'dictionary',
    description: 'Allow group users to change the spelling of existing words',
    dependency: 'WORDS',
  },
  {
    name: 'ADD_SPELLING',
    type: 'dictionary',
    description: 'Allow group users to add new spellings to existing words',
    dependency: 'WORDS',
  },
];

const mockPayload = {
  permission: {
    name: 'ADD_TRANSLATION',
    type: 'dictionary',
    description: 'Allow group users to add translations to existing words',
    dependency: 'WORDS',
  },
};

const mockPermissionsDao = {
  getUserPermissions: jest.fn().mockResolvedValue(mockPermissions),
  getGroupPermissions: jest.fn().mockResolvedValue(mockPermissions),
  addPermission: jest.fn().mockResolvedValue(),
  removePermission: jest.fn().mockResolvedValue(),
  getAllPermissions: jest.fn().mockResolvedValue(mockPermissions),
};

describe('GET /userpermissions', () => {
  const PATH = `${API_PATH}/userpermissions`;
  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('retrieves user permissions', async () => {
    const response = await sendRequest();
    expect(mockPermissionsDao.getUserPermissions).toHaveBeenCalled();
    expect(JSON.parse(response.text)).toEqual(mockPermissions);
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed user permission load', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /permissions', () => {
  const PATH = `${API_PATH}/permissions`;
  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('retrives all permissions', async () => {
    const response = await sendRequest();
    expect(mockPermissionsDao.getAllPermissions).toHaveBeenCalled();
    expect(JSON.parse(response.text)).toEqual(mockPermissions);
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed all permissions retrieval', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getAllPermissions: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 if no user', async () => {
    const response = await request(app).get(PATH);
    expect(mockPermissionsDao.getAllPermissions).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admins', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPermissionsDao.getAllPermissions).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('GET /permissions/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/permissions/${groupId}`;
  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('returns 200 on successful user permission retreival', async () => {
    const response = await sendRequest();
    expect(mockPermissionsDao.getGroupPermissions).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed user permission retrieval', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getGroupPermissions: jest.fn().mockRejectedValue('get user permissions failed'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 403 for non-admins', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPermissionsDao.getGroupPermissions).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 401 for non-logged in users', async () => {
    const response = await request(app).get(PATH);
    expect(mockPermissionsDao.getGroupPermissions).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});

describe('POST /permissions/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/permissions/${groupId}`;
  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).post(PATH).send(mockPayload).set('Cookie', 'jwt=token');

  it('returns 201 on successful addition', async () => {
    const response = await sendRequest();
    expect(mockPermissionsDao.addPermission).toHaveBeenCalledWith(String(groupId), mockPayload.permission);
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed addition', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      addPermission: jest.fn().mockRejectedValue('permissions addition failed'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 for non-logged in users', async () => {
    const response = await request(app).post(PATH).send(mockPayload);
    expect(mockPermissionsDao.addPermission).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admins', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPermissionsDao.addPermission).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('DELETE /permissions/:groupId/:permission', () => {
  const groupId = 1;
  const mockPermission = 'ADD_TRANSLATION';
  const PATH = `${API_PATH}/permissions/${groupId}/${mockPermission}`;
  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).delete(PATH).set('Cookie', 'jwt=token');

  it('returns 204 on successful deletion', async () => {
    const response = await sendRequest();
    expect(mockPermissionsDao.removePermission).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed deletion', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      removePermission: jest.fn().mockRejectedValue('permissions deletion failed'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 for non-logged-in users', async () => {
    const response = await request(app).delete(PATH);
    expect(mockPermissionsDao.removePermission).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admins', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockPermissionsDao.removePermission).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
