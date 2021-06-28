import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /group_edit_permissions/:groupId/:type', () => {
  const groupId = 1;
  const type = 'text';
  const PATH = `${API_PATH}/group_edit_permissions/${groupId}/${type}`;

  const mockGroupEditPermissionsDao = {
    getGroupEditPermissions: jest.fn().mockResolvedValue(['uuid1', 'uuid2']),
  };
  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue({
      name: 'test-name',
    }),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('GroupEditPermissionsDao', mockGroupEditPermissionsDao);
    sl.set('TextDao', mockTextDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful group edit permissions retrieval', async () => {
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.getGroupEditPermissions
    ).toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('does not allow non-logged-in user to get edit permissions', async () => {
    const response = await request(app).get(PATH);
    expect(
      mockGroupEditPermissionsDao.getGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to get edit permissions', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.getGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed edit permissionos retreival', async () => {
    sl.set('GroupEditPermissionsDao', {
      ...mockGroupEditPermissionsDao,
      getGroupEditPermissions: jest
        .fn()
        .mockRejectedValue('failed to get group edit permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /group_edit_permissions/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/group_edit_permissions/${groupId}`;

  const mockPayload = {
    uuids: ['uuid1', 'uuid2'],
    type: 'text',
  };

  const mockGroupEditPermissionsDao = {
    addItemsToGroupEditPermissions: jest.fn().mockResolvedValue(),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(true),
  };
  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue({
      name: 'test-name',
    }),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('GroupEditPermissionsDao', mockGroupEditPermissionsDao);
    sl.set('TextDao', mockTextDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPayload).set('Authorization', 'token');

  it('returns 201 on successful edit permissions insertion', async () => {
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.addItemsToGroupEditPermissions
    ).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.addItemsToGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('returns 400 if texts do not exist', async () => {
    sl.set('TextDao', {
      getTextByUuid: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.addItemsToGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('does not allow non-logged-in users to add to edit permissions', async () => {
    const response = await request(app).post(PATH).send(mockPayload);
    expect(
      mockGroupEditPermissionsDao.addItemsToGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to add to edit permissions', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.addItemsToGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed insertion', async () => {
    sl.set('GroupEditPermissionsDao', {
      ...mockGroupEditPermissionsDao,
      addItemsToGroupEditPermissions: jest
        .fn()
        .mockRejectedValue('failed to add to edit permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /group_edit_permissions/:groupId/:uuid', () => {
  const groupId = 1;
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/group_edit_permissions/${groupId}/${uuid}`;

  const mockGroupEditPermissionsDao = {
    removeItemFromGroupEditPermissions: jest.fn().mockResolvedValue(),
    containsAssociation: jest.fn().mockResolvedValue(true),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(true),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('GroupEditPermissionsDao', mockGroupEditPermissionsDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful edit permissions insertion', async () => {
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.removeItemFromGroupEditPermissions
    ).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.removeItemFromGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('returns 400 if no association exists', async () => {
    sl.set('GroupEditPermissionsDao', {
      ...mockGroupEditPermissionsDao,
      containsAssociation: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.removeItemFromGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('does not allow non-logged-in users to delete from edit permissions', async () => {
    const response = await request(app).delete(PATH);
    expect(
      mockGroupEditPermissionsDao.removeItemFromGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to delete from edit permissions', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(
      mockGroupEditPermissionsDao.removeItemFromGroupEditPermissions
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed deletion', async () => {
    sl.set('GroupEditPermissionsDao', {
      ...mockGroupEditPermissionsDao,
      removeItemFromGroupEditPermissions: jest
        .fn()
        .mockRejectedValue('failed to remove from edit permissions'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
