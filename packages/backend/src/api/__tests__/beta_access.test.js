import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockUserDao = {
  setBetaAccess: jest.fn().mockResolvedValue(),
  getUserByUuid: jest.fn().mockResolvedValue({
    uuid: 'test-user-uuid',
    isAdmin: true,
  }),
};

describe('PATCH /beta_access/allow', () => {
  const PATH = `${API_PATH}/beta_access/allow`;

  const setup = () => {
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).set('Authorization', 'token');

  it('returns 204 on successful beta access allowance', async () => {
    const response = await sendRequest();
    expect(mockUserDao.setBetaAccess).toHaveBeenCalledWith(
      'test-user-uuid',
      true
    );
    expect(response.status).toBe(204);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).patch(PATH);
    expect(mockUserDao.setBetaAccess).not.toHaveBeenCalledWith();
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });

    const response = await sendRequest();
    expect(mockUserDao.setBetaAccess).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('PATCH /beta_access/revoke', () => {
  const PATH = `${API_PATH}/beta_access/revoke`;

  const setup = () => {
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).set('Authorization', 'token');

  it('returns 204 on successful beta access revocation', async () => {
    const response = await sendRequest();
    expect(mockUserDao.setBetaAccess).toHaveBeenCalledWith(
      'test-user-uuid',
      false
    );
    expect(response.status).toBe(204);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).patch(PATH);
    expect(mockUserDao.setBetaAccess).not.toHaveBeenCalledWith();
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });

    const response = await sendRequest();
    expect(mockUserDao.setBetaAccess).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
