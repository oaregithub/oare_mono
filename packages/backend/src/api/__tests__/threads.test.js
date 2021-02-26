import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('comments api test', () => {
  const commentsGetAllByThreadUuid = [
    {
      uuid: 'string',
      threadUuid: 'string',
      userUuid: 'string',
      createdAt: '',
      deleted: 'boolean',
      text: 'string',
    },
  ];
  const MockCommentsDao = {
    getAllByThreadUuid: jest.fn().mockResolvedValue(commentsGetAllByThreadUuid),
    insert: jest.fn().mockResolvedValue(''),
  };

  const threadUuids = ['uuid1'];

  const threadsGetByReferenceUuid = [
    {
      uuid: 'string',
      referenceUuid: 'string',
      status: 'New',
      route: 'route',
    },
  ];
  const threadsGetByUuid = {
    uuid: 'string',
    referenceUuid: 'string',
    status: 'New',
    route: 'route',
  };

  const threadWord = 'threadWord';

  const MockThreadsDao = {
    getByReferenceUuid: jest.fn().mockResolvedValue(threadsGetByReferenceUuid),
    update: jest.fn().mockResolvedValue({}),
    getByUuid: jest.fn().mockResolvedValue(threadsGetByUuid),
    updateThreadName: jest.fn().mockResolvedValue({}),
    getThreadWord: jest.fn().mockResolvedValue(threadWord),
    getAll: jest.fn().mockResolvedValue(threadsGetByReferenceUuid),
    getAllThreadUuidsByUserUuid: jest.fn().mockResolvedValue(threadUuids),
  };

  const userGetUserByUuid = {
    firstName: 'first',
    lastName: 'last',
  };
  const MockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue(userGetUserByUuid),
    getUserByEmail: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const threadFoundInfo = {
    uuid: 'string',
    referenceUuid: 'string',
    status: 'New',
    route: 'route',
  };

  const commentWithFoundUserInfo = {
    uuid: 'string',
    threadUuid: 'string',
    userUuid: 'string',
    createdAt: null,
    deleted: 'boolean',
    text: 'string',
    userFirstName: 'first',
    userLastName: 'last',
  };

  const commentWithoutFoundUserInfo = {
    uuid: 'string',
    threadUuid: 'string',
    userUuid: 'string',
    createdAt: null,
    deleted: 'boolean',
    text: 'string',
    userFirstName: '',
    userLastName: '',
  };

  const setup = () => {
    sl.set('CommentsDao', MockCommentsDao);
    sl.set('ThreadsDao', MockThreadsDao);
    sl.set('UserDao', MockUserDao);
  };

  beforeEach(setup);

  describe('GET /threads/:referenceUuid', () => {
    const PATH = `${API_PATH}/threads/testReferenceUuid`;

    const sendRequest = async (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns successful thread, comment and user info.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: threadFoundInfo,
          comments: [commentWithFoundUserInfo],
        },
      ]);
    });

    it('returns 401, for non-logged in users.', async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
      expect(MockThreadsDao.getByReferenceUuid).not.toHaveBeenCalled();
    });

    it('returns 500, invalid comment.', async () => {
      sl.set('CommentsDao', {
        ...MockCommentsDao,
        getAllByThreadUuid: jest
          .fn()
          .mockRejectedValue('Error getting an invalid comment.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockUserDao.getUserByUuid).not.toHaveBeenCalled();
    });

    it('returns 500, invalid thread.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getByReferenceUuid: jest
          .fn()
          .mockRejectedValue('Error getting an invalid thread.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockCommentsDao.getAllByThreadUuid).not.toHaveBeenCalled();
    });

    it('returns 500, invalid user.', async () => {
      sl.set('UserDao', {
        ...MockUserDao,
        getUserByUuid: jest
          .fn()
          .mockRejectedValue('Error getting an invalid user.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockCommentsDao.getAllByThreadUuid).toHaveBeenCalled();
    });

    it('returns 200, even when no thread is found.', async () => {
      sl.set('ThreadsDao', {
        getByReferenceUuid: jest.fn().mockResolvedValue([]),
      });

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([]);
    });

    it('returns 200, even when no comments are found.', async () => {
      sl.set('CommentsDao', {
        getAllByThreadUuid: jest.fn().mockResolvedValue([]),
      });

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(MockUserDao.getUserByUuid).not.toHaveBeenCalled();
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: threadFoundInfo,
          comments: [],
        },
      ]);
    });

    it('returns 200, even when no user is found.', async () => {
      sl.set('UserDao', {
        ...MockUserDao,
        getUserByUuid: jest.fn().mockResolvedValue(null),
      });

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: threadFoundInfo,
          comments: [commentWithoutFoundUserInfo],
        },
      ]);
    });
  });

  describe('PUT /threads', () => {
    const PATH = `${API_PATH}/threads`;

    const getPayload = ({ overrideThread } = {}) => {
      const thread = overrideThread || {
        uuid: 'string',
        referenceUuid: 'string',
        status: 'New',
        route: 'route',
      };

      return thread;
    };

    const sendRequest = async ({ overrideThread, cookie = true } = {}) => {
      const req = request(app).put(PATH).send(getPayload(overrideThread));
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns successful thread, comment and user info.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
    });

    it('returns 401 for non-logged in users.', async () => {
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
      expect(MockThreadsDao.getByUuid).not.toHaveBeenCalled();
    });

    it('returns 403 for non-admin users.', async () => {
      sl.set('UserDao', {
        ...MockUserDao,
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
      expect(MockThreadsDao.getByUuid).not.toHaveBeenCalled();
    });

    it('invalid thread uuid.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getByUuid: jest.fn().mockResolvedValue(null),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.update).not.toHaveBeenCalled();
    });

    it('500 reject error for thread update.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        update: jest
          .fn()
          .mockRejectedValue('Error, thread unable to be updated.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.getByUuid).toHaveBeenCalled();
      expect(MockCommentsDao.insert).not.toHaveBeenCalled();
    });

    it('500 reject error for admin comment insert.', async () => {
      sl.set('CommentsDao', {
        ...MockCommentsDao,
        insert: jest
          .fn()
          .mockRejectedValue('Error when admin comment unable to be inserted.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.update).toHaveBeenCalled();
    });
  });

  describe('PUT /threads/name', () => {
    const PATH = `${API_PATH}/threads/name`;

    const getPayload = ({ overrideThread } = {}) => {
      const newUpdateThreadName = overrideThread || {
        threadUuid: 'testUuid',
        newName: 'testName',
      };

      return newUpdateThreadName;
    };

    const sendRequest = async ({ overrideThread, cookie = true } = {}) => {
      const req = request(app).put(PATH).send(getPayload(overrideThread));
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns 200 when thread name is successfully updated.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(204);
    });

    it('returns 401 for non-logged in users.', async () => {
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
      expect(MockThreadsDao.updateThreadName).not.toHaveBeenCalled();
    });

    it('500 reject error for thread name update.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        updateThreadName: jest
          .fn()
          .mockRejectedValue('Error, thread name unable to be updated.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
  describe('GET /threads/user/:userUuid', () => {
    const PATH = `${API_PATH}/threads/user/testUserUuid`;

    const sendRequest = async (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns successful thread display info.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: threadsGetByUuid,
          word: threadWord,
          latestCommentDate: commentsGetAllByThreadUuid[0].createdAt,
          comments: commentsGetAllByThreadUuid,
        },
      ]);
    });

    it('returns 401 when non-logged in user accesses endpoint.', async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('returns 500 when ThreadsDao.getAllThreadUuidsByUserUuid throws an error.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getAllThreadUuidsByUserUuid: jest
          .fn()
          .mockRejectedValue(
            'Error when getting comments by userUuid, grouped by thread.'
          ),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.getByUuid).not.toHaveBeenCalled();
    });

    it('returns 500 when ThreadsDao.getByUuid throws an error.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getByUuid: jest
          .fn()
          .mockRejectedValue('Error when getting thread by its uuid.'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.getAllThreadUuidsByUserUuid).toHaveBeenCalled();
    });

    it('returns 500 when ThreadsDao.getByUuid returns null (should never happen).', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getByUuid: jest.fn().mockResolvedValue(null),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.getAllThreadUuidsByUserUuid).toHaveBeenCalled();
    });

    it('returns 500 when ThreadsDao.getThreadWord throws an error.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getThreadWord: jest
          .fn()
          .mockRejectedValue(
            'Error when retrieving word/form/spelling associated with thread.'
          ),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.getAllThreadUuidsByUserUuid).toHaveBeenCalled();
    });

    it('returns 500 when ThreadsDao.getThreadWord returns null (should never happen).', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getThreadWord: jest.fn().mockResolvedValue(null),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockThreadsDao.getAllThreadUuidsByUserUuid).toHaveBeenCalled();
    });
  });

  describe('GET /threads', () => {
    const PATH = `${API_PATH}/threads`;

    const sendRequest = async (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns 200, successful thread display all info.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: threadsGetByUuid,
          word: threadWord,
          latestCommentDate: commentsGetAllByThreadUuid[0].createdAt,
          comments: commentsGetAllByThreadUuid,
        },
      ]);
    });

    it('returns 200, successful returns empty list of threads if none found.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getAll: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([]);
    });

    it('returns 500, unsuccessfully retrieves all threads.', async () => {
      sl.set('ThreadsDao', {
        ...MockThreadsDao,
        getAll: jest.fn().mockRejectedValue('Error when returning all threads'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500, unsuccessfully retrieves latest comment.', async () => {
      sl.set('CommentsDao', {
        ...MockCommentsDao,
        getAllByThreadUuid: jest
          .fn()
          .mockRejectedValue(
            'Error when returning all comments by thread uuid'
          ),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 401 when non-logged in user tries to access route.', async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('returns 403 when non-admin user tries to access route.', async () => {
      sl.set('UserDao', {
        ...MockUserDao,
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });
  });
});
