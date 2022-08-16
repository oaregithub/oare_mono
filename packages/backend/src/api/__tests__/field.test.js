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

  const editFieldPayload = {
    uuid: 'uuid',
    description: 'edited description',
    primacy: 1,
  };

  const newFieldInfo = {
    referenceUuid: 'refUuid',
    description: 'new description',
    primacy: 1,
  };

  const MockFieldDao = {
    updateAllFieldFields: jest.fn().mockResolvedValue(),
    insertField: jest.fn().mockResolvedValue(),
    getFieldInfoByReferenceAndType: jest.fn().mockResolvedValue(fieldInfo),
    detectLanguage: jest.fn().mockResolvedValue('English'),
  };

  const MockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    clear: jest.fn(),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const MockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const MockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_EDIT_FIELD_DESCRIPTION',
      },
    ]),
  };

  const setup = () => {
    sl.set('FieldDao', MockFieldDao);
    sl.set('cache', MockCache);
    sl.set('UserDao', MockUserDao);
    sl.set('PermissionsDao', MockPermissionsDao);
  };

  beforeEach(setup);

  describe('GET /field_description/:referenceUuid', () => {
    const refUuid = 'referenceUuid';
    const PATH = `${API_PATH}/field_description/${refUuid}`;
    const sendRequest = async () => request(app).get(PATH);
    it('returns a FieldInfo object on request', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(fieldInfo);
      expect(MockFieldDao.getFieldInfoByReferenceAndType).toHaveBeenCalled();
    });
  });

  describe('POST /update_field_description', () => {
    const PATH = `${API_PATH}/update_field_description`;
    const sendRequest = async (auth = true, field = newFieldInfo) => {
      const req = request(app).post(PATH).send(field);
      return auth ? req.set('Authorization', 'token') : req;
    };

    it('returns successful 201, adds field info', async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('returns successful 201, adds field info when admin', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('returns successful 201, adds field info when primacy 2', async () => {
      const response = await sendRequest(true, { ...newFieldInfo, primacy: 2 });
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

    it('returns 403 for user with wrong permission', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest
          .fn()
          .mockResolvedValue(['VIEW_FIELD_DESCRIPTION']),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 403 for user without permission primacy 2', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest(true, {
        ...newFieldInfo,
        primacy: 2,
      });
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
        ...editFieldPayload,
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

  describe('PATCH /update_field_description', () => {
    const PATH = `${API_PATH}/update_field_description`;
    const sendRequest = async (auth = true, field = editFieldPayload) => {
      const req = request(app).post(PATH).send(field);
      return auth ? req.set('Authorization', 'token') : req;
    };

    it('returns successful 201, edits field info', async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('returns successful 201, edits field info when admin', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('returns successful 201, edits field info when primacy 2', async () => {
      const response = await sendRequest(true, {
        ...editFieldPayload,
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

    it('returns 403 for user with wrong permission', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest
          .fn()
          .mockResolvedValue(['VIEW_FIELD_DESCRIPTION']),
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
        ...editFieldPayload,
        primacy: 2,
      });
      expect(response.status).toBe(403);
    });

    it('returns 403 for user without permission primacy 2', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest(true, {
        ...editFieldPayload,
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
