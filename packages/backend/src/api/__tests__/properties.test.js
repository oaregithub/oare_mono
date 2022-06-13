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
        variable: {
          uuid: 'test-uuid',
          type: 'test-type',
          parentUuid: 'test-parent',
          objectUuid: 'test-object',
          objParentUuid: 'test-parent',
          variableName: 'test-name',
          valueName: 'test-name',
          aliasName: 'test-name',
          varAbbreviation: 'test-abb',
          valAbbreviation: 'test-abb',
          variableUuid: 'test-uuid',
          valueUuid: 'test-uuid',
          level: 1,
          children: null,
          custom: null,
        },
        value: {
          uuid: 'test-uuid',
          type: 'test-type',
          parentUuid: 'test-parent',
          objectUuid: 'test-object',
          objParentUuid: 'test-parent',
          variableName: 'test-name',
          valueName: 'test-name',
          aliasName: 'test-name',
          varAbbreviation: 'test-abb',
          valAbbreviation: 'test-abb',
          variableUuid: 'test-uuid',
          valueUuid: 'test-uuid',
          level: 1,
          children: null,
          custom: null,
        },
      },
    ],
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
    addProperty: jest.fn().mockResolvedValue(),
    deletePropertiesByReferenceUuid: jest.fn().mockResolvedValue(),
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
    expect(mockItemPropertiesDao.addProperty).toHaveBeenCalled();
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
      addProperty: jest
        .fn()
        .mockRejectedValue('failed to update form properties'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
