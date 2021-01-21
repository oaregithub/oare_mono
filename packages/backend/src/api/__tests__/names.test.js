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

describe('GET /names', () => {
  const PATH = `${API_PATH}/names`;
  const mockDictionaryWordDao = {
    getNames: jest.fn().mockResolvedValue(mockGET),
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

  it('returns 200 on successful names retrieval', async () => {
    const response = await sendRequest();
    expect(mockDictionaryWordDao.getNames).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed names retrieval', async () => {
    sl.set('DictionaryWordDao', {
      getNames: jest.fn().mockRejectedValue('failed names retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
