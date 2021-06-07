import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('profile test', () => {
  const PATH = `${API_PATH}/profile`;

  const payload = {
    email: 'new email',
    firstName: 'new first name',
    lastName: 'new last name',
  };

  const user = {
    uuid: 'user-uuid',
    email: 'user email',
    firstName: 'test',
    lastName: 'user',
  };

  const UserDao = {
    getUserByUuid: jest.fn().mockResolvedValue(user),
    updateProfile: jest.fn().mockResolvedValue(),
  };

  beforeEach(() => {
    sl.set('UserDao', UserDao);
  });

  const sendRequest = (auth = true) => {
    const req = request(app).patch(PATH).send(payload);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it("doesn't allow updating profile if you're not signed in", async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
    expect(UserDao.updateProfile).not.toHaveBeenCalled();
  });

  it('updates profile', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(204);
    expect(UserDao.updateProfile).toHaveBeenCalledWith(user.uuid, payload);
  });
});
