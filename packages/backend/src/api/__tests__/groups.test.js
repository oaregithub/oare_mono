import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /groups/:id', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/groups/${groupId}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
    getGroupById: jest.fn().mockResolvedValue({}),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 when getting group', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
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
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when fails to retrieve group', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      getGroupById: jest.fn().mockRejectedValue('Failed to retrieve group'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /groups/:id', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/groups/${groupId}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
    deleteGroup: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 200 when successfully deletes group', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(201);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      groupExists: jest.fn().mockResolvedValue(false),
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
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when fails to delete group', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      deleteGroup: jest.fn().mockRejectedValue('Failed to delete group'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /groupd/:id', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/groups/${groupId}`;

  const mockBody = {
    description: 'New description',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockOareGroupDao = {
    groupExists: jest.fn().mockResolvedValue(true),
    updateGroupDescription: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).send(mockBody).set('Authorization', 'token');

  it('returns 204 when successfully updates group description', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(204);
  });

  it('returns 400 when group does not exist', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      groupExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 when description is longer than 200 characters', async () => {
    const response = await request(app)
      .patch(PATH)
      .send({ description: 'a'.repeat(201) })
      .set('Authorization', 'token');
    expect(response.status).toBe(400);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await request(app).patch(PATH).send(mockBody);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when fails to update group description', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      updateGroupDescription: jest
        .fn()
        .mockRejectedValue('Failed to update group description'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /groups', () => {
  const PATH = `${API_PATH}/groups`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockOareGroupDao = {
    getAllGroupIds: jest.fn().mockResolvedValue([1, 2, 3]),
    getGroupById: jest.fn().mockResolvedValue({}),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 when successfully retrieves groups', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await request(app).get(PATH);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when fails to retrieve group ids', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      getAllGroupIds: jest
        .fn()
        .mockRejectedValue('Failed to retrieve group ids'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /groups', () => {
  const PATH = `${API_PATH}/groups`;

  const mockBody = {
    name: 'New group',
    description: 'New description',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockOareGroupDao = {
    groupNameExists: jest.fn().mockResolvedValue(false),
    createGroup: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('OareGroupDao', mockOareGroupDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockBody).set('Authorization', 'token');

  it('returns 201 when successfully creates group', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(201);
  });

  it('returns 400 when group name already exists', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      groupNameExists: jest.fn().mockResolvedValue(true),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await request(app).post(PATH).send(mockBody);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when fails to create group', async () => {
    sl.set('OareGroupDao', {
      ...mockOareGroupDao,
      createGroup: jest.fn().mockRejectedValue('Failed to create group'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
