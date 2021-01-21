import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockGET = {
  uuid: 'uuid1',
  word: 'word1',
  translation: 'translation1',
  forms: [],
};

describe('GET /places', () => {
  const PATH = `${API_PATH}/places`;
  const mockDictionaryWordDao = {
    getPlaces: jest.fn().mockResolvedValue(mockGET),
  };
  const mockCache = {
    insert: jest.fn(),
  };

  const setup = () => {
    sl.set('DictionaryWordDao', mockDictionaryWordDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue(),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('returns 200 on successful places retrieval', async () => {
    const response = await sendRequest();
    expect(mockDictionaryWordDao.getPlaces).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed places retrieval', async () => {
    sl.set('DictionaryWordDao', {
      getPlaces: jest.fn().mockRejectedValue('failed places retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
