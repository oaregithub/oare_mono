import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('PATCH /properties/edit/:referenceUuid', () => {
  const mockReferenceUuid = 'test-uuid';
  const PATH = `${API_PATH}/properties/edit/${mockReferenceUuid}`;

  const mockPayload = {
    properties: [
      {
        variableRow: {
          uuid: 'test-uuid',
          name: 'test-name',
          abbreviation: 'test-abb',
          type: 'decimal',
          tableReference: null,
          hierarchy: {
            uuid: 'test-hierarchy-1',
            parentUuid: 'test-parent-uuid',
            type: 'taxonomy',
            role: 'child',
            objectUuid: 'test-uuid',
            objectParentUuid: 'test-parent-uuid',
            objectGrandparentUuid: null,
            custom: 1,
          },
          level: 1,
          values: [],
          fieldInfo: null,
        },
        valueRow: null,
        value: 1,
        sourceUuid: 'test-source-uuid',
        objectUuid: null,
        objectDisplay: null,
      },
    ],
  };

  const mockPropertyRow = {
    uuid: 'uuid',
    referenceUuid: 'refUuid',
    parentUuid: 'parentUuid',
    level: null,
    variableUuid: null,
    variableName: 'variableName',
    varAbbrevation: null,
    valueUuid: '',
    valueName: 'valName',
    valAbbreviation: null,
    objectUuid: 'objUuid',
    value: 'val',
  };
  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      uuid: 'user-uuid',
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'EDIT_ITEM_PROPERTIES',
      },
    ]),
  };

  const mockItemPropertiesDao = {
    addProperties: jest.fn().mockResolvedValue(),
    deletePropertiesByReferenceUuid: jest.fn().mockResolvedValue(),
    getPropertiesByReferenceUuid: jest
      .fn()
      .mockResolvedValue([mockPropertyRow]),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const editFormSetup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(editFormSetup);

  const sendRequest = (auth = true) => {
    const req = request(app).patch(PATH).send(mockPayload);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful parse info edit', async () => {
    const response = await sendRequest();
    expect(
      mockItemPropertiesDao.deletePropertiesByReferenceUuid
    ).toHaveBeenCalled();
    expect(mockItemPropertiesDao.addProperties).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 401 when user not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission to edit parse info', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed form parse info edit', async () => {
    sl.set('ItemPropertiesDao', {
      addProperties: jest
        .fn()
        .mockRejectedValue('failed to update form properties'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /properties/:referenceUuid', () => {
  const mockReferenceUuid = 'test-uuid';
  const PATH = `${API_PATH}/properties/${mockReferenceUuid}`;

  const mockPropertyRow = {
    uuid: 'uuid',
    referenceUuid: 'refUuid',
    parentUuid: 'parentUuid',
    level: null,
    variableUuid: null,
    variableName: 'variableName',
    varAbbrevation: null,
    valueUuid: '',
    valueName: 'valName',
    valAbbreviation: null,
    objectUuid: 'objUuid',
    value: 'val',
  };

  const mockItemPropertiesDao = {
    addProperties: jest.fn().mockResolvedValue(),
    deletePropertiesByReferenceUuid: jest.fn().mockResolvedValue(),
    getPropertiesByReferenceUuid: jest
      .fn()
      .mockResolvedValue([mockPropertyRow]),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const setup = () => {
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () => {
    const req = request(app).get(PATH);
    return req;
  };

  it('returns 200 on successful parse info edit', async () => {
    const response = await sendRequest();
    expect(
      mockItemPropertiesDao.getPropertiesByReferenceUuid
    ).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on fail', async () => {
    sl.set('ItemPropertiesDao', {
      getPropertiesByReferenceUuid: jest
        .fn()
        .mockRejectedValue('failed to get item properties'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
