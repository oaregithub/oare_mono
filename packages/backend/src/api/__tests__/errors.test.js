import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('POST /errors', () => {
  const PATH = `${API_PATH}/errors`;
  const mockErrorsPayload = {
    description: 'testDescription',
    stacktrace: 'testStacktrace',
    status: 'testStatus',
  };
  const mockErrorsDao = {
    logError: jest.fn().mockResolvedValue(),
  };
  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      uuid: 'testUuid',
    }),
  };

  const setup = () => {
    sl.set('ErrorsDao', mockErrorsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app)
      .post(PATH)
      .send(mockErrorsPayload)
      .set('Authorization', 'token');

  it('returns 201 on successful error log', async () => {
    const response = await sendRequest();
    expect(mockErrorsDao.logError).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed error log', async () => {
    sl.set('ErrorsDao', {
      logError: jest.fn().mockRejectedValue('failed error log'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('logs error when no user is logged in', async () => {
    const response = await request(app).post(PATH).send(mockErrorsPayload);
    expect(mockErrorsDao.logError).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });
});

describe('GET /errors', () => {
  const mockGetPayload = {
    filters: {
      status: '',
      user: '',
      description: '',
      stacktrace: '',
    },
    sort: {
      type: 'timestamp',
      desc: false,
    },
    pagination: {
      page: 1,
      limit: 10,
    },
  };
  const PATH = `${API_PATH}/errors?payload=${JSON.stringify(mockGetPayload)}`;
  const mockErrorsRow = [
    {
      uuid: 'testUuid',
      user_uuid: 'testUserUuid',
      description: 'testDescription',
      stacktrace: 'testStacktrace',
      timestamp: 'testTimestamp',
      status: 'testStatus',
    },
  ];
  const mockErrorsDao = {
    getErrorLog: jest.fn().mockResolvedValue(mockErrorsRow),
  };
  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      uuid: 'testUuid',
      isAdmin: true,
    }),
  };

  const setup = () => {
    sl.set('ErrorsDao', mockErrorsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful error log retrieval', async () => {
    const response = await sendRequest();
    expect(mockErrorsDao.getErrorLog).toHaveBeenCalled();
    expect(JSON.parse(response.text)).toEqual(mockErrorsRow);
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed error log retrieval', async () => {
    sl.set('ErrorsDao', {
      getErrorLog: jest.fn().mockRejectedValue('failed error log retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-admins to retrieve error log', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockErrorsDao.getErrorLog).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to retrieve error log', async () => {
    const response = await request(app).get(PATH);
    expect(mockErrorsDao.getErrorLog).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});

describe('PATCH /errors', () => {
  const PATH = `${API_PATH}/errors`;
  const mockUpdateErrorStatusPayload = {
    uuids: ['testUuid1', 'testUuid2'],
    status: 'In Progress',
  };
  const mockErrorsDao = {
    updateErrorStatus: jest.fn().mockResolvedValue(),
  };
  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const setup = () => {
    sl.set('ErrorsDao', mockErrorsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app)
      .patch(PATH)
      .send(mockUpdateErrorStatusPayload)
      .set('Authorization', 'token');

  it('returns 204 on successful status update', async () => {
    const response = await sendRequest();
    expect(mockErrorsDao.updateErrorStatus).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed status update', async () => {
    sl.set('ErrorsDao', {
      updateErrorStatus: jest.fn().mockRejectedValue('failed status update'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-admins to update error status', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockErrorsDao.updateErrorStatus).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to update error status', async () => {
    const response = await request(app)
      .patch(PATH)
      .send(mockUpdateErrorStatusPayload);
    expect(mockErrorsDao.updateErrorStatus).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});
