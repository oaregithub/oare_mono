import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('names api test', () => {
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
      partsOfSpeech: [],
      specialClassifications: [],
      verbalThematicVowelTypes: [],
      forms: [
        {
          uuid: 'form1',
          form: 'Form1',
          spellings: ['Spelling1', 'Spelling2', 'Spelling3'],
          stems: [],
          tenses: [],
          cases: ['nom.', 'gen.', 'acc.'],
          states: [],
          moods: [],
          persons: [],
          grammaticalNumbers: [],
          morphologicalForms: [],
          genders: [],
          suffix: null,
          clitics: [],
        },
        {
          uuid: 'form2',
          form: 'Form2',
          spellings: ['SpellingOfOther'],
          stems: [],
          tenses: [],
          cases: ['nom.', 'gen.', 'acc.'],
          states: [],
          moods: [],
          persons: [],
          grammaticalNumbers: [],
          morphologicalForms: [],
          genders: [],
          suffix: null,
          clitics: [],
        },
      ],
    },
  ];

  describe('names api test', () => {
    const MockDictionaryWordDao = {
      getWords: jest.fn().mockResolvedValue(resolveValue),
    };

    const mockCache = {
      insert: jest.fn(),
    };

    const setup = ({ WordDao, cache } = {}) => {
      sl.set('DictionaryWordDao', WordDao || MockDictionaryWordDao);
      sl.set('cache', cache || mockCache);
    };

    describe('GET /names/:letter', () => {
      it('returns names info', async () => {
        const letter = 'A';
        const PATH = `${API_PATH}/names/${letter}`;
        setup();
        const response = await request(app).get(PATH);
        expect(MockDictionaryWordDao.getWords).toHaveBeenCalledWith('PN', 'a');
        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual(resolveValue);
      });

      it('checks multi letters', async () => {
        const letter = 'U/A';
        const PATH = `${API_PATH}/names/${encodeURIComponent(letter)}`;
        setup();
        const response = await request(app).get(PATH);
        expect(MockDictionaryWordDao.getWords).toHaveBeenCalledWith(
          'PN',
          'u/a'
        );
        expect(response.status).toBe(200);
      });
    });

    it('returns 500 on failed names retreival', async () => {
      const letter = 'A';
      const PATH = `${API_PATH}/names/${letter}`;
      setup({
        WordDao: {
          getWords: jest.fn().mockRejectedValue('Not a valid letter'),
        },
        ...mockCache,
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(500);
      expect(mockCache.insert).toHaveBeenCalledTimes(0);
    });

    it('checks cache insert', async () => {
      const letter = 'A';
      const PATH = `${API_PATH}/names/${letter}`;
      setup();
      await request(app).get(PATH);
      expect(mockCache.insert).toHaveBeenCalled();
    });
  });
});
