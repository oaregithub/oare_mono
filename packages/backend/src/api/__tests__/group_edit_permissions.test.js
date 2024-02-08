import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /group_edit_permissions/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/group_edit_permissions/${groupId}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockGroupEditPermissionsDao = {
    getGroupEditPermissions: jest.fn().mockResolvedValue(['text-uuid']),
  };

  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('GroupEditPermissionsDao', mockGroupEditPermissionsDao);
    sl.set('TextDao', mockTextDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful edit permissions retrieval', async () => {
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.getGroupEditPermissions
    ).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).get(PATH);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if edit permissions retrieval fails', async () => {
    sl.set('GroupEditPermissionsDao', {
      ...mockGroupEditPermissionsDao,
      getGroupEditPermissions: jest
        .fn()
        .mockRejectedValue('Error retrieving edit permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /group_edit_permissions/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/group_edit_permissions/${groupId}`;

  const mockBody = {
    uuids: ['text-uuid', 'text-uuid-2'],
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockGroupEditPermissionsDao = {
    addTextsToGroupEditPermissions: jest.fn().mockResolvedValue(),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const mockTextDao = {
    textExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('GroupEditPermissionsDao', mockGroupEditPermissionsDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('TextDao', mockTextDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockBody).set('Authorization', 'token');

  it('returns 201 on successful edit permissions addition', async () => {
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.addTextsToGroupEditPermissions
    ).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if a text does not exist', async () => {
    sl.set('TextDao', {
      textExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).post(PATH);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if edit permissions addition fails', async () => {
    sl.set('GroupEditPermissionsDao', {
      ...mockGroupEditPermissionsDao,
      addTextsToGroupEditPermissions: jest
        .fn()
        .mockRejectedValue('Error adding texts to edit permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /group_edit_permissions/:groupId/:uuid', () => {
  const groupId = 1;
  const uuid = 'text-uuid';
  const PATH = `${API_PATH}/group_edit_permissions/${groupId}/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockGroupEditPermissionsDao = {
    containsAssociation: jest.fn().mockResolvedValue(true),
    removeTextFromGroupEditPermissions: jest.fn().mockResolvedValue(),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('GroupEditPermissionsDao', mockGroupEditPermissionsDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful edit permissions removal', async () => {
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.removeTextFromGroupEditPermissions
    ).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if association does not exist', async () => {
    sl.set('GroupEditPermissionsDao', {
      containsAssociation: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).delete(PATH);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if edit permissions removal fails', async () => {
    sl.set('GroupEditPermissionsDao', {
      ...mockGroupEditPermissionsDao,
      removeTextFromGroupEditPermissions: jest
        .fn()
        .mockRejectedValue('Error removing text from edit permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
