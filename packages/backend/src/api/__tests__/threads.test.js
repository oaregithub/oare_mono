import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('comments api test', () => {
  const commentsDaoResolveValue = [
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
    getAllByThreadUuid: jest.fn().mockResolvedValue(commentsDaoResolveValue),
    insert: jest.fn().mockResolvedValue({}),
  };

  const threadsDaoResolveValue = [
    {
      uuid: 'string',
      referenceUuid: 'string',
      status: 'New',
      route: 'route',
    },
  ];
  const MockThreadsDao = {
    getByReferenceUuid: jest.fn().mockResolvedValue(threadsDaoResolveValue),
    update: jest.fn().mockResolvedValue({}),
    getByUuid: jest.fn().mockResolvedValue(''),
  };

  const userDaoResolveValue = {
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
    getUserByUuid: jest.fn().mockResolvedValue(userDaoResolveValue),
  };

  const setup = ({ CommentsDao, ThreadsDao, UserDao } = {}) => {
    sl.set('CommentsDao', CommentsDao || MockCommentsDao);
    sl.set('ThreadsDao', ThreadsDao || MockThreadsDao);
    sl.set('UserDao', UserDao || MockUserDao);
  };

  describe('GET /threads/:referenceUuid', () => {
    const PATH = `${API_PATH}/threads/testReferenceUuid`;

    it('returns successful thread, comment and user info.', async () => {
      setup();

      const response = await request(app).get(PATH);
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: {
            uuid: 'string',
            referenceUuid: 'string',
            status: 'New',
            route: 'route',
          },
          comments: [
            {
              uuid: 'string',
              threadUuid: 'string',
              userUuid: 'string',
              createdAt: null,
              deleted: 'boolean',
              text: 'string',
              userFirstName: 'first',
              userLastName: 'last',
            },
          ],
        },
      ]);
    });

    it('returns 500, invalid comment.', async () => {
      setup({
        CommentsDao: {
          getAllByThreadUuid: jest.fn().mockRejectedValue(null),
        },
        ...MockThreadsDao,
        ...MockUserDao,
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(500);

    });

    it('returns 500, invalid thread.', async () => {
      setup({
        ...MockCommentsDao,
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockRejectedValue(null),
        },
        ...MockUserDao,
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(500);
    });

    it('returns 500, invalid user.', async () => {
      setup({
        ...MockCommentsDao,
        ...MockThreadsDao,
        UserDao: {
          getUserByUuid: jest.fn().mockRejectedValue(null),
        },
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(500);
    });

    it('no thread found.', async () => {
      setup({
        ...MockCommentsDao,
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockResolvedValue([]),
        },
        ...MockUserDao,
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([]);
    });

    it('no comments found.', async () => {
      setup({
        CommentsDao: {
          getAllByThreadUuid: jest.fn().mockResolvedValue([]),
        },
        ...MockThreadsDao,
        ...MockUserDao,
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(200);
      expect(MockUserDao.getUserByUuid).not.toHaveBeenCalled();
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: {
            uuid: 'string',
            referenceUuid: 'string',
            status: 'New',
            route: 'route',
          },
          comments: [],
        },
      ]);
    });

    it('no user found.', async () => {
      setup({
        ...MockCommentsDao,
        ...MockThreadsDao,
        UserDao: {
          getUserByUuid: jest.fn().mockResolvedValue(null),
        },
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          thread: {
            uuid: 'string',
            referenceUuid: 'string',
            status: 'New',
            route: 'route',
          },
          comments: [
            {
              uuid: 'string',
              threadUuid: 'string',
              userUuid: 'string',
              createdAt: null,
              deleted: 'boolean',
              text: 'string',
              userFirstName: '',
              userLastName: '',
            },
          ],
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

    it('returns successful thread, comment and user info.', async () => {
      setup();

      const response = await request(app).put(PATH).send(getPayload());
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        success: true,
      });
    });

    it('invalid thread uuid.', async () => {
      setup({
        ...MockCommentsDao,
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockResolvedValue(threadsDaoResolveValue),
          update: jest.fn().mockResolvedValue({}),
          getByUuid: jest.fn().mockResolvedValue(null),
        },
        ...MockUserDao,
      });

      const response = await request(app).put(PATH).send(getPayload());
      expect(response.status).toBe(500);
    });

    it('500 reject error for thread update.', async () => {
      setup({
        ...MockCommentsDao,
        ThreadsDao: {
          getByReferenceUuid: jest.fn().mockResolvedValue(threadsDaoResolveValue),
          update: jest.fn().mockRejectedValue(null),
          getByUuid: jest.fn().mockResolvedValue(''),
        },
        ...MockUserDao,
      });

      const response = await request(app).put(PATH).send(getPayload());
      expect(response.status).toBe(500);
    });

    it('500 reject error for admin comment insert.', async () => {
      setup({
        CommentsDao: {
          getAllByThreadUuid: jest.fn().mockResolvedValue(commentsDaoResolveValue),
          insert: jest.fn().mockRejectedValue(null),
        },
        ...MockThreadsDao,
        ...MockUserDao,
      });

      const response = await request(app).put(PATH).send(getPayload());
      expect(response.status).toBe(500);
    });
  });
});
