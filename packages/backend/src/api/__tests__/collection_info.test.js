import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /collection_info/:uuid', () => {
  const uuid = 'mockUuid';
  const PATH = `${API_PATH}/collection_info/${uuid}`;
  const mockAliasDao = {
    textAliasNames: jest.fn().mockResolvedValue('mockName'),
  };
  const mockHierarchyDao = {
    isPublished: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('AliasDao', mockAliasDao);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue(),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('returns 200 on successful collection info retrieval', async () => {
    const response = await sendRequest();
    expect(mockAliasDao.textAliasNames).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed collection info retrieval', async () => {
    sl.set('AliasDao', {
      textAliasNames: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
