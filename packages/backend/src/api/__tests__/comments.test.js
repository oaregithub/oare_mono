import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('comments api test', () => {
  const commentsUuid = 'commentUuid';
  const commentsUpdateDeleteUuid = 'commentUpdateDeleteUuid';
  const MockCommentsDao = {
    insert: jest.fn().mockResolvedValue(commentsUuid),
    updateDelete: jest.fn().mockResolvedValue(commentsUpdateDeleteUuid),
  };

  const threadsUuid = 'threadUuid';
  const MockThreadsDao = {
    insert: jest.fn().mockResolvedValue(threadsUuid),
  };

  const MockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const MockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_COMMENTS',
      },
    ]),
  };

  const setup = () => {
    sl.set('CommentsDao', MockCommentsDao);
    sl.set('ThreadsDao', MockThreadsDao);
    sl.set('UserDao', MockUserDao);
    sl.set('PermissionsDao', MockPermissionsDao);
  };

  beforeEach(setup);

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

  const getPayload = ({ overrideComment, overrideThread } = {}) => {
    const comment = overrideComment || validComment;
    const thread = overrideThread || validThread;

    return { comment, thread };
  };

  describe('POST /comments', () => {
    const PATH = `${API_PATH}/comments`;
    const sendRequest = async ({
      overrideComment,
      overrideThread,
      cookie = true,
    } = {}) => {
      const req = request(app)
        .post(PATH)
        .send(getPayload({ overrideComment, overrideThread }));
      return cookie ? req.set('Authorization', 'token') : req;
    };

    it('returns successful 201, comment and thread info', async () => {
      const response = await sendRequest({
        overrideThread: doesNotExistThread,
      });
      expect(response.status).toBe(201);
      expect(JSON.parse(response.text)).toEqual(commentsUuid);
    });

    it('returns 201 successful, thread already exists', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
      expect(MockThreadsDao.insert).not.toHaveBeenCalled();
      expect(MockCommentsDao.insert).toHaveBeenCalled();
    });

    it('returns 401 on non-logged in user', async () => {
      const response = await sendRequest({
        cookie: false,
      });
      expect(response.status).toBe(401);
    });

    it('returns 500 on failed inserting comment', async () => {
      sl.set('CommentsDao', {
        insert: jest.fn().mockRejectedValue('Error inserting a comment'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /comments/:uuid', () => {
    const PATH = `${API_PATH}/comments/testUuid`;

    const sendRequest = async ({ cookie = true } = {}) => {
      const req = request(app).delete(PATH);
      return cookie ? req.set('Authorization', 'token') : req;
    };

    it('returns 200 upon successfully deleted comment', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(204);
    });

    it('returns 500 when unable to delete a comment', async () => {
      sl.set('CommentsDao', {
        ...MockCommentsDao,
        updateDelete: jest.fn().mockRejectedValue('Error deleting a comment'),
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
