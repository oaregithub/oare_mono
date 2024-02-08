import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /user_groups/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/user_groups/${groupId}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const mockUserGroupDao = {
    getUsersInGroup: jest.fn().mockResolvedValue(['test-user-uuid']),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserGroupDao', mockUserGroupDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful group users retrieval', async () => {
    const response = await sendRequest();
    expect(mockUserGroupDao.getUsersInGroup).toHaveBeenCalledWith(groupId);
    expect(response.status).toBe(200);
  });

  it('returns 400 if the group does not exist', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not an admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if group users retrieval fails', async () => {
    sl.set('UserGroupDao', {
      ...mockUserGroupDao,
      getUsersInGroup: jest
        .fn()
        .mockRejectedValue('Failed to retrieve group users'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /user_groups/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/user_groups/${groupId}`;

  const mockBody = {
    userUuids: ['test-user-uuid'],
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
    userExists: jest.fn().mockResolvedValue(true),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const mockUserGroupDao = {
    userInGroup: jest.fn().mockResolvedValue(false),
    addUserToGroup: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserGroupDao', mockUserGroupDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).post(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful user addition', async () => {
    const response = await sendRequest();
    expect(mockUserGroupDao.addUserToGroup).toHaveBeenCalledWith(
      groupId,
      mockBody.userUuids[0]
    );
    expect(response.status).toBe(201);
  });

  it('returns 400 if the group does not exist', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if one or more users do not exist', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      userExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if one or more users are already in the group', async () => {
    sl.set('UserGroupDao', {
      ...mockUserGroupDao,
      userInGroup: jest.fn().mockResolvedValue(true),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not an admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if user addition fails', async () => {
    sl.set('UserGroupDao', {
      ...mockUserGroupDao,
      addUserToGroup: jest
        .fn()
        .mockRejectedValue('Failed to add user to group'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /user_groups/:groupId', () => {
  const groupId = 1;
  const userUuid = 'test-user-uuid';
  const PATH = `${API_PATH}/user_groups/${groupId}?userUuids[]=${userUuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
    userExists: jest.fn().mockResolvedValue(true),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
  };

  const mockUserGroupDao = {
    removeUserFromGroup: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserGroupDao', mockUserGroupDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).delete(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 204 on successful user removal', async () => {
    const response = await sendRequest();
    expect(mockUserGroupDao.removeUserFromGroup).toHaveBeenCalledWith(
      groupId,
      userUuid
    );
    expect(response.status).toBe(204);
  });

  it('returns 400 if the group does not exist', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if one or more of the users does not exist', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      userExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not an admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if user removal fails', async () => {
    sl.set('UserGroupDao', {
      ...mockUserGroupDao,
      removeUserFromGroup: jest
        .fn()
        .mockRejectedValue('Failed to remove user from group'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
