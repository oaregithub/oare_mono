import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /seals', () => {
  const PATH = `${API_PATH}/seals`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'SEALS' }]),
  };

  const mockSpatialUnitDao = {
    getAllSealUuids: jest
      .fn()
      .mockResolvedValue(['test-uuid-1', 'test-uuid-2']),
    getSealCoreByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('SpatialUnitDao', mockSpatialUnitDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful seals retrieval', async () => {
    const response = await sendRequest();
    expect(mockSpatialUnitDao.getAllSealUuids).toHaveBeenCalled();
    expect(mockSpatialUnitDao.getSealCoreByUuid).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if seals retrieval fails', async () => {
    sl.set('SpatialUnitDao', {
      ...mockSpatialUnitDao,
      getAllSealUuids: jest.fn().mockRejectedValue('Failed to retrieve seals'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /seals/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/seals/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'SEALS' }]),
  };

  const mockSpatialUnitDao = {
    spatialUnitExists: jest.fn().mockResolvedValue(true),
    getSealByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('SpatialUnitDao', mockSpatialUnitDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful seal retrieval', async () => {
    const response = await sendRequest();
    expect(mockSpatialUnitDao.getSealByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 400 if the seal does not exist', async () => {
    sl.set('SpatialUnitDao', {
      ...mockSpatialUnitDao,
      spatialUnitExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if seal retrieval fails', async () => {
    sl.set('SpatialUnitDao', {
      ...mockSpatialUnitDao,
      getSealByUuid: jest.fn().mockRejectedValue('Failed to retrieve seal'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /seals/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/seals/${uuid}`;

  const mockBody = {
    name: 'test-name',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'EDIT_SEAL' }]),
  };

  const mockAliasDao = {
    updateName: jest.fn().mockResolvedValue(),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('AliasDao', mockAliasDao);
    sl.set('cache', mockCache);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).patch(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful seal name update', async () => {
    const response = await sendRequest();
    expect(mockAliasDao.updateName).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if seal name update fails', async () => {
    sl.set('AliasDao', {
      ...mockAliasDao,
      updateName: jest.fn().mockRejectedValue('Failed to update seal name'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATH /seal_impression', () => {
  const PATH = `${API_PATH}/seal_impression`;

  const mockBody = {
    sealUuid: 'test-seal-uuid',
    textEpigraphyUuid: 'test-text-epigraphy-uuid',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'ADD_SEAL_LINK' }]),
  };

  const mockItemPropertiesDao = {
    getItemPropertiesByReferenceUuid: jest.fn().mockResolvedValue([
      {
        valueUuid: 'ec820e17-ecc7-492f-86a7-a01b379622e1',
        uuid: 'test-item-property-uuid',
      },
    ]),
    insertItemPropertyRows: jest.fn().mockResolvedValue(),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('cache', mockCache);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).patch(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful seal impression connection', async () => {
    const response = await sendRequest();
    expect(mockItemPropertiesDao.insertItemPropertyRows).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if seal impression connection fails', async () => {
    sl.set('ItemPropertiesDao', {
      ...mockItemPropertiesDao,
      insertItemPropertyRows: jest
        .fn()
        .mockRejectedValue('Failed to connect seal impression'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /seal_impression/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/seal_impression/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'ADD_SEAL_LINK' }]),
  };

  const mockItemPropertiesDao = {
    getItemPropertiesByReferenceUuid: jest.fn().mockResolvedValue([
      {
        variableUuid: 'f32e6903-67c9-41d8-840a-d933b8b3e719',
        objectUuid: 'test-object-uuid',
      },
    ]),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful seal impression retrieval', async () => {
    const response = await sendRequest();
    expect(
      mockItemPropertiesDao.getItemPropertiesByReferenceUuid
    ).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if seal impression retrieval fails', async () => {
    sl.set('ItemPropertiesDao', {
      ...mockItemPropertiesDao,
      getItemPropertiesByReferenceUuid: jest
        .fn()
        .mockRejectedValue('Failed to retrieve seal impression'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
