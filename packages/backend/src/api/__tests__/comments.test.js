import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('POST /comments', () => {
  const PATH = `${API_PATH}/comments`;

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_COMMENTS',
      },
    ]),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: false,
    }),
  };

  const mockCommentsDao = {
    createComment: jest.fn().mockResolvedValue(),
  };

  const mockThreadsDao = {
    threadExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('CommentsDao', mockCommentsDao);
    sl.set('ThreadsDao', mockThreadsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app)
      .post(PATH)
      .set('Authorization', 'token')
      .send({ threadUuid: 'threadUuid', comment: 'comment' });

  it('returns 201 on comment creation', async () => {
    const response = await sendRequest();
    expect(mockThreadsDao.threadExists).toHaveBeenCalled();
    expect(mockCommentsDao.createComment).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 400 if thread does not exist', async () => {
    sl.set('ThreadsDao', {
      threadExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 on non-logged in user', async () => {
    const response = await request(app).post(PATH).send({});
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed inserting comment', async () => {
    sl.set('CommentsDao', {
      createComment: jest.fn().mockRejectedValue('Error inserting a comment'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /comments/:uuid', () => {
  const commentUuid = 'testUuid';
  const PATH = `${API_PATH}/comments/${commentUuid}`;

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_COMMENTS',
      },
    ]),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: false,
    }),
  };

  const mockCommentsDao = {
    commentExists: jest.fn().mockResolvedValue(true),
    markAsDeleted: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('CommentsDao', mockCommentsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = async () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 upon successfully deleted comment', async () => {
    const response = await sendRequest();
    expect(mockCommentsDao.markAsDeleted).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 400 if comment does not exist', async () => {
    sl.set('CommentsDao', {
      ...mockCommentsDao,
      commentExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 500 when unable to delete a comment', async () => {
    sl.set('CommentsDao', {
      ...mockCommentsDao,
      markAsDeleted: jest.fn().mockRejectedValue('Error deleting a comment'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 when user is not logged-in', async () => {
    const response = await request(app).delete(PATH);
    expect(response.status).toBe(401);
  });
});
