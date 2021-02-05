import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('comments api test', () => {
  const commentsDaoResolveValue = 'commentUuid';
  const MockCommentsDao = {
    insert: jest.fn().mockResolvedValue(commentsDaoResolveValue),
    updateDelete: jest.fn().mockResolvedValue(commentsDaoResolveValue),
  };

  const threadsDaoResolveValue = 'threadUuid';
  const MockThreadsDao = {
    insert: jest.fn().mockResolvedValue(threadsDaoResolveValue),
  };

  const setup = ({ CommentsDao, ThreadsDao } = {}) => {
    sl.set('CommentsDao', CommentsDao || MockCommentsDao);
    sl.set('ThreadsDao', ThreadsDao || MockThreadsDao);
  };

  const getPayload = ({ Comment, Thread } = {}) => {
    const comment = Comment || {
      uuid: null,
      threadUuid: null,
      userUuid: 'userUuid',
      createdAt: null,
      deleted: false,
      text: 'text',
    };
    const thread = Thread || {
      uuid: null,
      referenceUuid: 'wordUuid',
      status: 'New',
      route: 'route',
    };

    return { comment, thread };
  };

  describe('POST /comments', () => {
    const PATH = `${API_PATH}/comments`;

    it('returns successful comment and thread info', async () => {
      setup();
      const response = await request(app).post(PATH).send(getPayload());
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        commentUuid: commentsDaoResolveValue,
        threadUuid: threadsDaoResolveValue,
      });
    });

    it('returns successful, thread already exists', async () => {
      setup();

      const payload = getPayload({
        Comment: null,
        Thread: {
          uuid: 'threadExists',
          referenceUuid: 'wordUuid',
          status: 'New',
          route: 'route',
        },
      });

      const response = await request(app).post(PATH).send(payload);
      expect(response.status).toBe(200);
      expect(MockThreadsDao.insert).not.toHaveBeenCalled();
      expect(MockCommentsDao.insert).toHaveBeenCalled();

    });

    it('fails inserting thread', async () => {
      setup({
        ...MockCommentsDao,
        ThreadsDao: {
          insert: jest.fn().mockRejectedValue(null),
        },
      });
      const response = await request(app).post(PATH).send(getPayload());
      expect(response.status).toBe(500);
    });

    it('fails inserting comment', async () => {
      setup({
        CommentsDao: {
          insert: jest.fn().mockRejectedValue(null),
        },
        ...MockThreadsDao,
      });
      const response = await request(app).post(PATH).send(getPayload());
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /comments/:uuid', () => {
    const PATH = `${API_PATH}/comments/testUuid`;

    it('returns successfully deleted comment', async () => {
      setup();

      const response = await request(app).delete(PATH);
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        success: true,
      });
    });

    it('returns 500 when unable to delete a comment', async () => {
      setup({
        ...MockThreadsDao,
        CommentsDao: {
          updateDelete: jest.fn().mockRejectedValue(null),
        },
      });

      const response = await request(app).delete(PATH);
      expect(response.status).toBe(500);
    });
  });
});
