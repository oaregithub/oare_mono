import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const resolveValue = [
  {
    uuid: 'word1',
    word: 'coolBeans',
    translation: [
      {
        uuid: 'translationUuid',
        translation: 'testTranslation',
      },
    ],
    forms: [
      {
        uuid: 'form1',
        form: 'Form1',
        spellings: ['Spelling1', 'Spelling2', 'Spelling3'],
        cases: ['nom.', 'gen.', 'acc.'],
      },
      {
        uuid: 'form2',
        form: 'Form2',
        spellings: ['SpellingOfOther'],
        cases: ['nom.', 'gen.', 'acc.'],
      },
    ],
  },
];

describe('places api test', () => {
  const MockDictionaryWordDao = {
    getWords: jest.fn().mockResolvedValue(resolveValue),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: false,
      uuid: 'test-user-uuid',
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'PLACES',
      },
    ]),
  };

  const setup = ({ WordDao, cache } = {}) => {
    sl.set('DictionaryWordDao', WordDao || MockDictionaryWordDao);
    sl.set('cache', mockCache);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
  };

  describe('GET /places/:letter', () => {
    it('returns places info', async () => {
      const letter = 'A';
      const PATH = `${API_PATH}/places/${letter}`;
      setup();
      const response = await request(app)
        .get(PATH)
        .set('Authorization', 'token');
      expect(MockDictionaryWordDao.getWords).toHaveBeenCalledWith('GN', 'a');
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(resolveValue);
    });

    it('checks multi letters', async () => {
      const letter = 'U/A';
      const PATH = `${API_PATH}/places/${encodeURIComponent(letter)}`;
      setup();
      const response = await request(app)
        .get(PATH)
        .set('Authorization', 'token');
      expect(MockDictionaryWordDao.getWords).toHaveBeenCalledWith('GN', 'u/a');
      expect(response.status).toBe(200);
    });

    it('returns 500 on failed places retrieval', async () => {
      const letter = 'A';
      const PATH = `${API_PATH}/places/${letter}`;
      setup({
        WordDao: {
          getWords: jest.fn().mockRejectedValue('Not a valid letter'),
        },
      });

      const response = await request(app)
        .get(PATH)
        .set('Authorization', 'token');
      expect(response.status).toBe(500);
      expect(mockCache.insert).toHaveBeenCalledTimes(0);
    });

    it('checks cache insert', async () => {
      const letter = 'A';
      const PATH = `${API_PATH}/places/${letter}`;
      setup();
      await request(app).get(PATH).set('Authorization', 'token');
      expect(mockCache.insert).toHaveBeenCalled();
    });
  });
});
