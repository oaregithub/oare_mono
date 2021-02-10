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

  const sendRequest = () => request(app).post(PATH).send(mockErrorsPayload).set('Cookie', 'jwt=token');

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
