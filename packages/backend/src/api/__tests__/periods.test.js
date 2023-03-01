import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockPermissionsDao = {
  getUserPermissions: jest.fn().mockResolvedValue([
    {
      name: 'PERIODS',
    },
  ]),
};

const mockCache = {
  retrieve: jest.fn().mockResolvedValue(null),
  insert: jest.fn().mockImplementation((_key, response, _filter) => response),
};

const mockUserDao = {
  getUserByUuid: jest.fn().mockResolvedValue({
    uuid: 'user-uuid',
  }),
};

describe('GET /periods', () => {
  const PATH = `${API_PATH}/periods`;
  const mockRows = [];
  const mockYears = [];
  const mockPeriodsDao = {
    getPeriodRows: jest.fn().mockResolvedValue(mockRows),
    getYears: jest.fn().mockResolvedValue(mockYears),
  };

  const setup = () => {
    sl.set('PeriodsDao', mockPeriodsDao);
    sl.set('cache', mockCache);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful period call', async () => {
    const response = await sendRequest();
    expect(mockPeriodsDao.getPeriodRows).toHaveBeenCalled();
    expect(mockPeriodsDao.getYears).toHaveBeenCalled();
  });

  it('returns 500 on failed period call', async () => {
    sl.set('PeriodsDao', {
      ...mockPeriodsDao,
      getPeriodRows: jest.fn().mockRejectedValue('failed period call'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 when logged in user does not have the PERIOD permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });
});
