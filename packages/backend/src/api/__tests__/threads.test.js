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
      userFirstName: 'first',
      userLastName: 'last',
    },
  ];
  const MockCommentsDao = {
    getAllByThreadUuid: jest.fn().mockResolvedValue(commentsGetAllByThreadUuid),
    insert: jest.fn().mockResolvedValue(''),
  };

  const threadsGetByReferenceUuid = [
    {
      uuid: 'string',
      referenceUuid: 'string',
      status: 'New',
      route: 'route',
    },
  ];
  const MockThreadsDao = {
    getByReferenceUuid: jest.fn().mockResolvedValue(threadsGetByReferenceUuid),
    update: jest.fn().mockResolvedValue({}),
    getByUuid: jest.fn().mockResolvedValue({}),
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

    const sendRequest = async ({ cookie = true } = {}) => {
      if (cookie) {
        return request(app).get(PATH).set('Cookie', 'jwt=token');
      } else {
        return request(app).get(PATH);
      }
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
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
    });

    it('returns 500, invalid comment.', async () => {
      sl.set('CommentsDao', {
        getAllByThreadUuid: jest.fn().mockRejectedValue('Erro getting an invalid comment.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);

    });

    it('returns 500, invalid thread.', async () => {
      sl.set('ThreadsDao', {
        getByReferenceUuid: jest.fn().mockRejectedValue('Error getting an invalid thread.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500, invalid user.', async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockRejectedValue('Error getting an invalid user.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
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
        getUserByUuid: jest.fn().mockResolvedValue(null),
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: true,
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

    const getPayload = ({ overrideThread } = {}) => {
      const thread = overrideThread || {
        uuid: 'string',
        referenceUuid: 'string',
        status: 'New',
        route: 'route',
      };

      return thread;
    };

    const sendRequest = async ({ overrideThread } = {}) => {
      if (cookie) {
        return request(app).put(PATH).set('Cookie', 'jwt=token').send(getPayload(overrideThread));
      } else {
        return request(app).put(PATH).send(getPayload(overrideThread));
      }
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
    });

    it('returns 403 for non-admin users.', async () => {

      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('invalid thread uuid.', async () => {
      sl.set('ThreadsDao', {
        getByReferenceUuid: jest.fn().mockResolvedValue(threadsGetByReferenceUuid),
        update: jest.fn().mockResolvedValue({}),
        getByUuid: jest.fn().mockResolvedValue(null),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('500 reject error for thread update.', async () => {
      sl.set('ThreadsDao', {
        getByReferenceUuid: jest.fn().mockResolvedValue(threadsGetByReferenceUuid),
        update: jest.fn().mockRejectedValue('Error, thread unable to be updated.'),
        getByUuid: jest.fn().mockResolvedValue(''),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('500 reject error for admin comment insert.', async () => {
      sl.set('CommentsDao', {
        getAllByThreadUuid: jest.fn().mockResolvedValue(threadsGetByReferenceUuid),
        insert: jest.fn().mockRejectedValue('Error when admin comment unable to be inserted.'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
