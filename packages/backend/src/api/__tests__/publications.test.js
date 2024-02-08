import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /publications', () => {
  const PATH = `${API_PATH}/publications`;

  const mockPublicationDao = {
    getAllPublicationPrefixes: jest.fn().mockResolvedValue(['test-prefix']),
    getPublicationByPrefix: jest.fn().mockResolvedValue({}),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('PublicationDao', mockPublicationDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful publications retrieval', async () => {
    const response = await sendRequest();
    expect(mockPublicationDao.getAllPublicationPrefixes).toHaveBeenCalled();
    expect(mockPublicationDao.getPublicationByPrefix).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('returns 500 if publications retrieval fails', async () => {
    sl.set('PublicationDao', {
      ...mockPublicationDao,
      getAllPublicationPrefixes: jest
        .fn()
        .mockRejectedValue('Failed to retrieve publications'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
