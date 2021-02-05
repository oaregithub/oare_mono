import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('comments api test', () => {
  const commentsDaoGetAllByThreadUuidResolveValue = [
    {
      uuid: 'string',
      threadUuid: 'string',
      userUuid: 'string',
      createdAt: '',
      deleted: 'boolean',
      text: 'string',
      userFirstName: 'first',
      userLastName: 'last',
    },
  ];
  const MockCommentsDao = {
    getAllByThreadUuid: jest.fn().mockResolvedValue(commentsDaoGetAllByThreadUuidResolveValue),
    insert: jest.fn().mockResolvedValue({}),
  };

  const threadsDaoGetByReferenceUuidResolveValue = [
    {
      uuid: 'string',
      referenceUuid: 'string',
      status: 'New',
      route: 'route',
    },
  ];
  const MockThreadsDao = {
    getByReferenceUuid: jest.fn().mockResolvedValue(threadsDaoGetByReferenceUuidResolveValue),
    update: jest.fn().mockResolvedValue({}),
    getByUuid: jest.fn().mockResolvedValue(''),
  };

  const userDaoGetUserByUuidResolveValue = {
    number: 1,
    uuid: 'test',
    firstName: 'first',
    lastName: 'last',
    email: 'email',
    passwordHash: 'hash',
    isAdmin: true,
    createdOn: 'date',
  };
  const MockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue(userDaoGetUserByUuidResolveValue),
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

  const setup = ({ CommentsDao, ThreadsDao, UserDao } = {}) => {
    sl.set('CommentsDao', CommentsDao || MockCommentsDao);
    sl.set('ThreadsDao', ThreadsDao || MockThreadsDao);
    sl.set('UserDao', UserDao || MockUserDao);
  };

  describe('GET /threads/:referenceUuid', () => {
    const PATH = `${API_PATH}/threads/testReferenceUuid`;

    const sendRequest = async ({ cookie = true } = {}) => {
      if (cookie) {
        return request(app).get(PATH).set('Cookie', 'jwt=token');
      } else {
        return request(app).get(PATH);
      }
    };

    it('returns successful thread, comment and user info.', async () => {
      setup();

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
      setup();
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
    });

    it('returns 500, invalid comment.', async () => {
      setup({
        CommentsDao: {
          getAllByThreadUuid: jest.fn().mockRejectedValue('returns 500 when passed an invalid comment.'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);

    });

    it('returns 500, invalid thread.', async () => {
      setup({
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockRejectedValue('returns 500 when passed an invalid thread.'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500, invalid user.', async () => {
      setup({
        UserDao: {
          getUserByUuid: jest.fn().mockRejectedValue('returns 500 when given an invalid user.'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 200, even when no thread is found.', async () => {
      setup({
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockResolvedValue([]),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([]);
    });

    it('returns 200, even when no comments are found.', async () => {
      setup({
        CommentsDao: {
          getAllByThreadUuid: jest.fn().mockResolvedValue([]),
        },
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
      setup({
        UserDao: {
          getUserByUuid: jest.fn().mockResolvedValue(null),
          getUserByEmail: jest.fn().mockResolvedValue({
            isAdmin: true,
          }),
        },
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

    const getPayload = ({ Thread } = {}) => {
      const thread = Thread || {
        uuid: 'string',
        referenceUuid: 'string',
        status: 'New',
        route: 'route',
      };

      return thread;
    };

    const sendRequest = async ({ Thread, cookie = true } = {}) => {
      if (cookie) {
        return request(app).put(PATH).set('Cookie', 'jwt=token').send(getPayload(Thread));
      } else {
        return request(app).put(PATH).send(getPayload(Thread));
      }
    };

    it('returns successful thread, comment and user info.', async () => {
      setup();

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        success: true,
      });
    });

    it('returns 401 for non-logged in users.', async () => {
      setup();
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
    });

    it('returns 403 for non-admin users.', async () => {
      setup({
        UserDao: {
          getUserByEmail: jest.fn().mockResolvedValue({
            isAdmin: false,
          }),
        },
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('invalid thread uuid.', async () => {
      setup({
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockResolvedValue(threadsDaoGetByReferenceUuidResolveValue),
          update: jest.fn().mockResolvedValue({}),
          getByUuid: jest.fn().mockResolvedValue(null),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('500 reject error for thread update.', async () => {
      setup({
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockResolvedValue(threadsDaoGetByReferenceUuidResolveValue),
          update: jest.fn().mockRejectedValue('returns 500 when thread unable to be updated.'),
          getByUuid: jest.fn().mockResolvedValue(''),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('500 reject error for admin comment insert.', async () => {
      setup({
        CommentsDao: {
          getAllByThreadUuid: jest.fn().mockResolvedValue(threadsDaoGetByReferenceUuidResolveValue),
          insert: jest.fn().mockRejectedValue('returns 500 when admin comment unable to be inserted.'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
