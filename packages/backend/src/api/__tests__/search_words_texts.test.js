import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import { getSubscriptVowelOptions } from '../daos/SignReadingDao/utils';

describe('words in texts search test', () => {
  describe('GET /searchWordsInTexts', () => {
    const PATH = `${API_PATH}/searchWordsInTexts`;

    const wordsInTextsSearchResultRow = [
      {
        uuid: 'uuid',
        name: 'Test Text',
        discourse: 'discourse',
        discourseUuids: ['discourseUuids'],
      },
    ];
    const wordsInTextsSearchResponse = {
      results: wordsInTextsSearchResultRow,
      total: wordsInTextsSearchResultRow.length,
    };
    const TextDiscourseDao = {
      wordsInTextsSearch: jest
        .fn()
        .mockResolvedValue(wordsInTextsSearchResponse),
    };

    const CollectionTextUtils = {
      textsToHide: jest.fn().mockResolvedValue(['textUuid']),
    };

    const TextDao = {
      getTextByUuid: jest.fn().mockResolvedValue({
        name: 'Test Text',
      }),
    };

    beforeEach(() => {
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('CollectionTextUtils', CollectionTextUtils);
      sl.set('TextDao', TextDao);
    });

    const query = {
      uuids: ['uuid1', 'uuid2'],
      numWordsBetween: [1, 3, 4],
      page: 1,
      rows: 25,
      sequenced: 'true',
    };

    const sendRequest = () => request(app).get(PATH).query(query);

    it('returns search results', async () => {
      const response = await sendRequest();
      expect(TextDiscourseDao.wordsInTextsSearch).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(wordsInTextsSearchResponse);
    });
  });
  describe('GET /wordsAndForms', () => {
    const PATH = `${API_PATH}/wordsAndForms`;

    const wordFormAutoCompleteDisplay = {
      uuid: 'uuid',
      wordDisplay: 'wordDisplay',
    };

    const DictionaryWordDao = {
      getWordsAndFormsForWordsInTexts: jest
        .fn()
        .mockResolvedValue([wordFormAutoCompleteDisplay]),
    };

    beforeEach(() => {
      sl.set('DictionaryWordDao', DictionaryWordDao);
    });

    const sendRequest = () => request(app).get(PATH);

    it('returns words and forms', async () => {
      const response = await sendRequest();
      expect(
        DictionaryWordDao.getWordsAndFormsForWordsInTexts
      ).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([wordFormAutoCompleteDisplay]);
    });
  });

  describe('GET /formOptions', () => {
    const PATH = `${API_PATH}/formOptions`;
    const query = {
      uuid: 'formOrWordUuid',
    };

    const wordUuid = 'wordUuid';

    const dictionaryWord = {
      uuid: wordUuid,
      word: 'word',
      partsOfSpeech: [],
      specialClassifications: [],
      translations: [],
      verbalThematicVowelTypes: [],
    };

    const dictionaryForm = {
      uuid: 'formUuid',
      form: 'form',
      spellings: [],
    };

    const word = {
      ...dictionaryWord,
      forms: [dictionaryForm],
    };

    const DictionaryWordDao = {
      getWordUuidByWordOrFormUuid: jest.fn().mockResolvedValue(wordUuid),
      getGrammaticalInfo: jest.fn().mockResolvedValue(dictionaryWord),
    };

    const DictionaryFormDao = {
      getWordForms: jest.fn().mockResolvedValue([dictionaryForm]),
    };

    beforeEach(() => {
      sl.set('DictionaryWordDao', DictionaryWordDao);
      sl.set('DictionaryFormDao', DictionaryFormDao);
    });

    const sendRequest = () => request(app).get(PATH).query(query);

    it('successfully retruns word form options', async () => {
      const response = await sendRequest();
      expect(DictionaryWordDao.getWordUuidByWordOrFormUuid).toHaveBeenCalled();
      expect(DictionaryWordDao.getGrammaticalInfo).toHaveBeenCalled();
      expect(DictionaryFormDao.getWordForms).toHaveBeenCalled();
      expect(JSON.parse(response.text)).toEqual(word);
      expect(response.status).toBe(200);
    });
  });
});
