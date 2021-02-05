import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('comments api test', () => {
  const commentsDaoInsertResolveValue = 'commentUuid';
  const commentsDaoUpdateDeleteResolveValue = 'commentUpdateDeleteUuid';
  const MockCommentsDao = {
    insert: jest.fn().mockResolvedValue(commentsDaoInsertResolveValue),
    updateDelete: jest.fn().mockResolvedValue(commentsDaoUpdateDeleteResolveValue),
  };

  const threadsDaoInsertResolveValue = 'threadUuid';
  const MockThreadsDao = {
    insert: jest.fn().mockResolvedValue(threadsDaoInsertResolveValue),
  };

  const MockUserDao = {
    insert: jest.fn().mockResolvedValue(threadsDaoInsertResolveValue),
    getUserByEmail: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const setup = ({ CommentsDao, ThreadsDao, UserDao } = {}) => {
    sl.set('CommentsDao', CommentsDao || MockCommentsDao);
    sl.set('ThreadsDao', ThreadsDao || MockThreadsDao);
    sl.set('UserDao', UserDao || MockUserDao);
  };

  const validComment = {
    uuid: 'uuid',
    threadUuid: 'threadUuid',
    userUuid: 'userUuid',
    createdAt: null,
    deleted: false,
    text: 'text',
  };

  const validThread = {
    uuid: 'uuid',
    referenceUuid: 'wordUuid',
    status: 'New',
    route: 'route',
  };

  const doesNotExistThread = {
    uuid: null,
    referenceUuid: 'wordUuid',
    status: 'New',
    route: 'route',
  };

  const getPayload = ({ Comment, Thread } = {}) => {
    const comment = Comment || validComment;
    const thread = Thread || validThread;

    return { comment, thread };
  };

  describe('POST /comments', () => {
    const PATH = `${API_PATH}/comments`;
    const sendRequest = async ({ Comment, Thread, cookie = true } = {}) => {
      if (cookie) {
        return request(app)
          .post(PATH)
          .set('Cookie', 'jwt=token')
          .send(getPayload({ Comment, Thread }));
      } else {
        return request(app)
          .post(PATH)
          .send(getPayload({ Comment, Thread }));
      }
    };

    it('returns successful 200, comment and thread info', async () => {
      setup();
      const response = await sendRequest({
        Thread: doesNotExistThread,
      });
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        commentUuid: commentsDaoInsertResolveValue,
        threadUuid: threadsDaoInsertResolveValue,
      });
    });

    it('returns 200 successful, thread already exists', async () => {
      setup();

      const payload = getPayload({
        Comment: null,
      });

      const response = await sendRequest(payload);
      expect(response.status).toBe(200);
      expect(MockThreadsDao.insert).not.toHaveBeenCalled();
      expect(MockCommentsDao.insert).toHaveBeenCalled();

    });

    it('returns 401 on non-logged in user', async () => {
      setup();
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
    });

    it('returns 500 on failed thread insertion', async () => {
      setup({
        ThreadsDao: {
          insert: jest.fn().mockRejectedValue('Send 500 upon failing to insert a thread'),
        },
      });
      const response = await sendRequest({
        Thread: doesNotExistThread,
      });
      expect(response.status).toBe(500);
    });

    it('returns 500 on failed inserting comment', async () => {
      setup({
        CommentsDao: {
          insert: jest.fn().mockRejectedValue('Send 500 upon failing to insert a comment'),
        },
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /comments/:uuid', () => {
    const PATH = `${API_PATH}/comments/testUuid`;

    const sendRequest = async ({ cookie = true } = {}) => {
      if (cookie) {
        return request(app).delete(PATH).set('Cookie', 'jwt=token');
      } else {
        return request(app).delete(PATH);
      }
    };

    it('returns 200 upon successfully deleted comment', async () => {
      setup();

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        success: true,
      });
    });

    it('returns 500 when unable to delete a comment', async () => {
      setup({
        CommentsDao: {
          updateDelete: jest.fn().mockRejectedValue('Send 500 upon failing to delete a comment'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 401 when user is not logged-in', async () => {
      setup();
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
    });
  });
});
