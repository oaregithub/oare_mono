import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /field/:uuid', () => {
  const uuid = 'test-uuid';
  const type = 'description';
  const PATH = `${API_PATH}/field/${uuid}?type=${type}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: false,
    }),
  };

  const mockFieldDao = {
    getFieldRowsByReferenceUuidAndType: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('FieldDao', mockFieldDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on field rows retrieval', async () => {
    const response = await sendRequest();
    expect(mockFieldDao.getFieldRowsByReferenceUuidAndType).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 401 if no logged in user', async () => {
    const response = await request(app).get(PATH);
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed field rows retrieval', async () => {
    sl.set('FieldDao', {
      getFieldRowsByReferenceUuidAndType: jest
        .fn()
        .mockRejectedValue('Error retrieving field rows'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /field/:uuid', () => {
  const referenceUuid = 'test-uuid';
  const PATH = `${API_PATH}/field/${referenceUuid}`;

  const mockBody = {
    field: 'test-field',
    primacy: 2,
    type: 'description',
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_EDIT_FIELD_DESCRIPTION',
      },
    ]),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockFieldDao = {
    insertField: jest.fn().mockResolvedValue(),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const mockUtils = {
    detectLanguage: jest.fn().mockResolvedValue('en'),
  };

  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
    sl.set('FieldDao', mockFieldDao);
    sl.set('cache', mockCache);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockBody).set('Authorization', 'token');

  it('returns 201 on field insertion', async () => {
    const response = await sendRequest();
    expect(mockFieldDao.insertField).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 400 if user is not admin and primacy > 1', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if no user logged in', async () => {
    const response = await request(app).post(PATH).send(mockBody);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if field insertion fails', async () => {
    sl.set('FieldDao', {
      insertField: jest.fn().mockRejectedValue('Error inserting field'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /field/:uuid', () => {
  const referenceUuid = 'test-uuid';
  const PATH = `${API_PATH}/field/${referenceUuid}`;

  const mockBody = {
    field: 'test-field',
    primacy: 2,
    type: 'description',
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_EDIT_FIELD_DESCRIPTION',
      },
    ]),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockFieldDao = {
    fieldExists: jest.fn().mockResolvedValue(true),
    updateField: jest.fn().mockResolvedValue(),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const mockUtils = {
    detectLanguage: jest.fn().mockResolvedValue('en'),
  };

  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
    sl.set('FieldDao', mockFieldDao);
    sl.set('cache', mockCache);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).send(mockBody).set('Authorization', 'token');

  it('returns 204 on successful field update', async () => {
    const response = await sendRequest();
    expect(mockFieldDao.updateField).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 400 if user is not admin and primacy > 1', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if the field does not exist', async () => {
    sl.set('FieldDao', {
      ...mockFieldDao,
      fieldExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if no user logged in', async () => {
    const response = await request(app).patch(PATH).send(mockBody);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if field update fails', async () => {
    sl.set('FieldDao', {
      ...mockFieldDao,
      updateField: jest.fn().mockRejectedValue('Error updating field'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /field/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/field/${uuid}`;

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_EDIT_FIELD_DESCRIPTION',
      },
    ]),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockFieldDao = {
    fieldExists: jest.fn().mockResolvedValue(true),
    deleteField: jest.fn().mockResolvedValue(),
    decrementPrimacy: jest.fn().mockResolvedValue(),
    getFieldRowByUuid: jest.fn().mockResolvedValue({
      referenceUuid: 'test-reference-uuid',
      primacy: 1,
      type: 'description',
    }),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
    sl.set('FieldDao', mockFieldDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful field deletion', async () => {
    const response = await sendRequest();
    expect(mockFieldDao.deleteField).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 400 if field does not exist', async () => {
    sl.set('FieldDao', {
      ...mockFieldDao,
      fieldExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if no user logged in', async () => {
    const response = await request(app).delete(PATH);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if delete field fails', async () => {
    sl.set('FieldDao', {
      ...mockFieldDao,
      deleteField: jest.fn().mockRejectedValue('Error deleting field'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
