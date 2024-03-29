import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockUser = {
  id: 1,
  firstName: 'first1',
  lastName: 'last1',
  email: 'email1',
  isAdmin: true,
};

const mockPOSTDELETE = {
  userUuids: ['1', '2', '3', '4', '5'],
};

describe('GET /user_groups/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/user_groups/${groupId}`;
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(true),
  };
  const mockUserGroupDao = {
    getUsersInGroup: jest.fn().mockResolvedValue(['uuid']),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue(mockUser),
  };

  const setup = () => {
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserGroupDao', mockUserGroupDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful group retrieval', async () => {
    const response = await sendRequest();
    expect(mockOareGroupDao.getGroupById).toHaveBeenCalled();
    expect(mockUserGroupDao.getUsersInGroup).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual([mockUser]);
  });

  it('returns 500 on failed group retrieval', async () => {
    sl.set('UserGroupDao', {
      getUsersInGroup: jest.fn().mockRejectedValue('failed group retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-admins to get groups', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockOareGroupDao.getGroupById).not.toHaveBeenCalled();
    expect(mockUserGroupDao.getUsersInGroup).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to get groups', async () => {
    const response = await request(app).get(PATH);
    expect(mockOareGroupDao.getGroupById).not.toHaveBeenCalled();
    expect(mockUserGroupDao.getUsersInGroup).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(mockUserGroupDao.getUsersInGroup).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});

describe('POST /user_groups/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/user_groups/${groupId}`;
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(true),
  };
  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };
  const mockUserGroupDao = {
    addUserToGroup: jest.fn().mockResolvedValue(),
    userInGroup: jest.fn().mockResolvedValue(false),
  };

  const setup = () => {
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserDao', mockUserDao);
    sl.set('UserGroupDao', mockUserGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPOSTDELETE).set('Authorization', 'token');

  it('returns 201 on successful addition', async () => {
    const response = await sendRequest();
    expect(mockOareGroupDao.getGroupById).toHaveBeenCalled();
    expect(mockUserGroupDao.addUserToGroup).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed addition', async () => {
    sl.set('UserGroupDao', {
      ...mockUserGroupDao,
      addUserToGroup: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-admins to post groups', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockUserGroupDao.addUserToGroup).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to post groups', async () => {
    const response = await request(app).post(PATH).send(mockPOSTDELETE);
    expect(mockUserGroupDao.addUserToGroup).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      getGroupById: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if user already belongs to group', async () => {
    sl.set('UserGroupDao', {
      ...mockUserGroupDao,
      userInGroup: jest.fn().mockResolvedValue(true),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });
});
