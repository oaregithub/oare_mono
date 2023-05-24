import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('field api test', () => {
  const fieldInfo = {
    uuid: 'uuid',
    referenceUuid: 'referenceUuid',
    field: 'field',
    primacy: 1,
    language: 'default',
    type: 'description',
  };

  const fieldPayload = {
    description: 'new description',
    primacy: 1,
    isTaxonomy: false,
  };

  const mockFieldDao = {
    updateField: jest.fn().mockResolvedValue(),
    insertField: jest.fn().mockResolvedValue(),
    getFieldRowsByReferenceUuidAndType: jest.fn().mockResolvedValue(fieldInfo),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    clear: jest.fn(),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_EDIT_FIELD_DESCRIPTION',
      },
    ]),
  };

  const mockUtils = {
    detectLanguage: jest.fn().mockResolvedValue('English'),
  };

  const setup = () => {
    sl.set('FieldDao', mockFieldDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  describe('GET /field/:uuid', () => {
    const referenceUuid = 'test-reference-uuid';
    const PATH = `${API_PATH}/field/${referenceUuid}`;
    const sendRequest = async () => request(app).get(PATH);
    it('returns a FieldInfo object on request', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(fieldInfo);
      expect(
        mockFieldDao.getFieldRowsByReferenceUuidAndType
      ).toHaveBeenCalled();
    });
  });

  describe('POST /field/:uuid', () => {
    const referenceUuid = 'test-reference-uuid';
    const PATH = `${API_PATH}/field/${referenceUuid}`;

    const sendRequest = async (auth = true, field = fieldPayload) => {
      const req = request(app).post(PATH).send(field);
      return auth ? req.set('Authorization', 'token') : req;
    };

    it('returns 201 on successful insertion', async () => {
      const response = await sendRequest();
      expect(mockFieldDao.insertField).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('returns 201 when admin adds primacy > 1', async () => {
      const response = await sendRequest(true, { ...fieldPayload, primacy: 2 });
      expect(mockFieldDao.insertField).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('returns 400 when non-admin attempts to add primacy > 1', async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest(true, { ...fieldPayload, primacy: 2 });
      expect(response.status).toBe(400);
    });

    it('returns 403 for user without permission', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 403 for non-admin user with correct permission primacy 2', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest
          .fn()
          .mockResolvedValue(['ADD_EDIT_FIELD_DESCRIPTION']),
      });
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest(true, {
        ...fieldPayload,
        primacy: 2,
      });
      expect(response.status).toBe(403);
    });

    it('returns 500 on failed inserting field info', async () => {
      sl.set('FieldDao', {
        insertField: jest.fn().mockRejectedValue('Error inserting field info'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /field/:uuid', () => {
    const uuid = 'test-uuid';
    const PATH = `${API_PATH}/field/${uuid}`;

    const sendRequest = async (auth = true, field = fieldPayload) => {
      const req = request(app).patch(PATH).send(field);
      return auth ? req.set('Authorization', 'token') : req;
    };

    it('returns successful 201, edits field info', async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(mockFieldDao.updateField).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('returns successful 201, edits field info when admin', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('returns successful 201, edits field info when primacy 2', async () => {
      const response = await sendRequest(true, {
        ...fieldPayload,
        primacy: 2,
      });
      expect(response.status).toBe(201);
    });

    it('returns 403 for user without permission', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 403 for non-admin user with correct permission primacy 2', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest
          .fn()
          .mockResolvedValue(['ADD_EDIT_FIELD_DESCRIPTION']),
      });
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest(true, {
        ...fieldPayload,
        primacy: 2,
      });
      expect(response.status).toBe(403);
    });

    it('returns 403 for user without permission primacy 2', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest(true, {
        ...fieldPayload,
        primacy: 2,
      });
      expect(response.status).toBe(403);
    });

    it('returns 500 on failed editing field info', async () => {
      sl.set('FieldDao', {
        insertField: jest.fn().mockRejectedValue('Error inserting field info'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
