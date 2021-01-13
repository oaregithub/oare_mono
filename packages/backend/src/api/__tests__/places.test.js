import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import utils from '@/utils';
import { NameOrPlace } from '@oare/types';
import DictionaryDao from '../daos/DictionaryWordDao';
import AliasDao from '../daos/AliasDao';

describe('places api test', () => {
  const mockDictionaryWords = [{ uuid: 'word1', word: 'coolBeans' }];
  const mockDictionaryForms = [
    { uuid: 'form1', referenceUuid: 'word1', form: 'Form1' },
    { uuid: 'form2', referenceUuid: 'word1', form: 'Form2' },
  ];
  const mockDictionarySpellings = [
    { uuid: 'spelling1', referenceUuid: 'form1', explicitSpelling: 'Spelling1' },
    { uuid: 'spelling1', referenceUuid: 'form1', explicitSpelling: 'Spelling2' },
    { uuid: 'spelling1', referenceUuid: 'form1', explicitSpelling: 'Spelling3' },
    { uuid: 'spelling2', referenceUuid: 'form2', explicitSpelling: 'SpellingOfOther' },
  ];
  const mockFields = [{ uuid: 'translation1', referenceUuid: 'word1', field: 'This is a cool word' }];
  const mockItemProperties = [
    { uuid: 'property1', referenceUuid: 'form1', valueUuid: 'value1' },
    { uuid: 'property2', referenceUuid: 'form1', valueUuid: 'value2' },
    { uuid: 'property3', referenceUuid: 'form2', valueUuid: 'value1FromForm2' },
  ];
  const mockAliases = [
    { uuid: 'alias1', referenceUuid: 'value1', name: 'John' },
    { uuid: 'alias2', referenceUuid: 'value2', name: 'John2' },
    { uuid: 'alias3', referenceUuid: 'value1FromForm2', name: 'Jane' },
  ];

  const MockDictionaryWordDao = {
    getPlaces: jest.fn(DictionaryDao.getPlaces),
    PLACE_TYPE: jest.fn(DictionaryDao.PLACE_TYPE).mockReturnValue('GN'),
    NAMES_TYPE: jest.fn(DictionaryDao.NAMES_TYPE).mockReturnValue('PN'),
    getNamesOrPlaces: jest.fn(DictionaryDao.getNamesOrPlaces),
    reduceByReferenceUuid: jest.fn(DictionaryDao.reduceByReferenceUuid),
    parseNamesOrPlacesQueries: jest.fn(DictionaryDao.parseNamesOrPlacesQueries),
    getDictionaryWordsByType: jest.fn().mockResolvedValue(mockDictionaryWords),
    getDictionaryFormRows: jest.fn(DictionaryDao.getDictionaryFormRows),
    getDictionarySpellingRows: jest.fn(DictionaryDao.getDictionarySpellingRows),
    getFieldRows: jest.fn(DictionaryDao.getFieldRows),
    getItemPropertyRowsByAliasName: jest.fn(DictionaryDao.getItemPropertyRowsByAliasName),
    getAliasesByType: jest.fn(DictionaryDao.getAliasesByType),
  };

  const MockDictionaryFormDao = {
    getDictionaryFormRows: jest.fn().mockResolvedValue(mockDictionaryForms),
  };

  const MockDictionarySpellingDao = {
    getDictionarySpellingRows: jest.fn().mockResolvedValue(mockDictionarySpellings),
  };

  const MockFieldDao = {
    getFieldRows: jest.fn().mockResolvedValue(mockFields),
  };

  const MockItemPropertiesDao = {
    getItemPropertyRowsByAliasName: jest.fn().mockResolvedValue(mockItemProperties),
  };

  const MockAliasDao = {
    getAliasesByType: jest.fn().mockResolvedValue(mockAliases),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const setup = ({ WordDao, FormDao, SpellingDao, FieldDao, ItemPropertiesDao, aliasDao, cache } = {}) => {
    sl.set('DictionaryWordDao', WordDao || MockDictionaryWordDao);
    sl.set('DictionaryFormDao', FormDao || MockDictionaryFormDao);
    sl.set('DictionarySpellingDao', SpellingDao || MockDictionarySpellingDao);
    sl.set('FieldDao', FieldDao || MockFieldDao);
    sl.set('ItemPropertiesDao', ItemPropertiesDao || MockItemPropertiesDao);
    sl.set('AliasDao', aliasDao || MockAliasDao);
    sl.set('cache', cache || mockCache);
  };

  describe('GET /places/:letter', () => {
    it('returns places info', async () => {
      const letter = 'A';
      const PATH = `${API_PATH}/places/${letter}`;
      setup();
      const response = await request(app).get(PATH);
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          uuid: 'word1',
          word: 'coolBeans',
          translation: 'This is a cool word',
          forms: [
            {
              uuid: 'form1',
              form: 'Form1',
              spellings: ['Spelling1', 'Spelling2', 'Spelling3'],
              cases: 'John/John2',
            },
            {
              uuid: 'form2',
              form: 'Form2',
              spellings: ['SpellingOfOther'],
              cases: 'Jane',
            },
          ],
        },
      ]);
    });

    it('checks multi letters', async () => {
      const letter = 'U/A';
      const PATH = `${API_PATH}/places/${encodeURIComponent(letter)}`;
      setup();
      const response = await request(app).get(PATH);
      expect(response.status).toBe(200);
    });
  });
});
