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
    getUserByEmail: jest.fn().mockResolvedValue({
      uuid: 'testUuid',
    }),
  };

  const setup = () => {
    sl.set('ErrorsDao', mockErrorsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockErrorsPayload).set('Cookie', 'jwt=token');

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
  const PATH = `${API_PATH}/errors`;
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
    getUserByEmail: jest.fn().mockResolvedValue({
      uuid: 'testUuid',
      isAdmin: true,
    }),
  };
  const mockUtils = {
    extractPagination: jest.fn().mockResolvedValue({
      page: 1,
      filter: 10,
    }),
  };

  const setup = () => {
    sl.set('ErrorsDao', mockErrorsDao);
    sl.set('UserDao', mockUserDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

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
      getUserByEmail: jest.fn().mockResolvedValue({
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
