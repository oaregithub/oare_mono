import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /threads/:referenceUuid', () => {
  const referenceUuid = 'test-reference-uuid';
  const PATH = `${API_PATH}/threads/${referenceUuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'ADD_COMMENTS' }]),
  };

  const mockThreadsDao = {
    getThreadsByReferenceUuid: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ThreadsDao', mockThreadsDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 upon successful threads retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if threads retrieval fails', async () => {
    sl.set('ThreadsDao', {
      getThreadsByReferenceUuid: jest
        .fn()
        .mockRejectedValue('Failed to retrieve threads'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /threads/status/:uuid', () => {
  const uuid = 'test-thread-uuid';
  const PATH = `${API_PATH}/threads/status/${uuid}`;

  const mockBody = {
    status: 'Completed',
  };

  const mockUserDao = {
    getUserByUuid: jest
      .fn()
      .mockResolvedValue({ uuid: 'test-user-uuid', isAdmin: true }),
  };

  const mockThreadsDao = {
    threadExists: jest.fn().mockResolvedValue(true),
    getThreadByUuid: jest.fn().mockResolvedValue({ status: 'New' }),
    updateThreadStatus: jest.fn().mockResolvedValue(),
  };

  const mockCommentsDao = {
    createComment: jest.fn().mockResolvedValue(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('ThreadsDao', mockThreadsDao);
    sl.set('CommentsDao', mockCommentsDao);
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

  it('returns 204 upon successful thread status update', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(204);
  });

  it('returns 400 if the thread does not exist', async () => {
    sl.set('ThreadsDao', {
      threadExists: jest.fn().mockResolvedValue(false),
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
      getUserByUuid: jest
        .fn()
        .mockResolvedValue({ uuid: 'test-user-uuid', isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if thread status update fails', async () => {
    sl.set('ThreadsDao', {
      updateThreadStatus: jest
        .fn()
        .mockRejectedValue('Failed to update thread status'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /threads/name/:uuid', () => {
  const uuid = 'test-thread-uuid';
  const PATH = `${API_PATH}/threads/name/${uuid}`;

  const mockBody = {
    name: 'New name',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'ADD_COMMENTS' }]),
  };

  const mockThreadsDao = {
    threadExists: jest.fn().mockResolvedValue(true),
    updateThreadName: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ThreadsDao', mockThreadsDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).patch(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 204 upon successful thread name update', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(204);
  });

  it('returns 400 if thread does not exist', async () => {
    sl.set('ThreadsDao', {
      threadExists: jest.fn().mockResolvedValue(false),
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
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if thread name update fails', async () => {
    sl.set('ThreadsDao', {
      updateThreadName: jest
        .fn()
        .mockRejectedValue('Failed to update thread name'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /threads', () => {
  const PATH = `${API_PATH}/threads`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'ADD_COMMENTS' }]),
  };

  const mockThreadsDao = {
    getAllThreadUuids: jest.fn().mockResolvedValue(['test-thread-uuid']),
    getThreadByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockUtils = {
    extractPagination: jest
      .fn()
      .mockReturnValue({ filter: '', limit: 10, page: 1 }),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ThreadsDao', mockThreadsDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH).query({
      status: 'New',
      name: 'test-name',
      sort: 'name',
      desc: true,
      page: 1,
      limit: 10,
    });
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 upon successful threads retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if threads retrieval fails', async () => {
    sl.set('ThreadsDao', {
      getAllThreadUuids: jest
        .fn()
        .mockRejectedValue('Failed to retrieve threads'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /threads', () => {
  const PATH = `${API_PATH}/threads`;

  const mockBody = {
    referenceUuid: 'test-reference-uuid',
    name: 'test-name',
    tableReference: 'test-table-reference',
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'ADD_COMMENTS' }]),
  };

  const mockThreadsDao = {
    createThread: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ThreadsDao', mockThreadsDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).post(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 upon successful thread creation', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(201);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if thread creation fails', async () => {
    sl.set('ThreadsDao', {
      createThread: jest.fn().mockRejectedValue('Failed to create thread'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /new_threads', () => {
  const PATH = `${API_PATH}/new_threads`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockThreadsDao = {
    newThreadsExist: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('ThreadsDao', mockThreadsDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 upon successful new threads status retrieval', async () => {
    const response = await sendRequest();
    expect(mockThreadsDao.newThreadsExist).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not an admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if new threads status retrieval fails', async () => {
    sl.set('ThreadsDao', {
      newThreadsExist: jest
        .fn()
        .mockRejectedValue('Failed to retrieve new threads status'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
