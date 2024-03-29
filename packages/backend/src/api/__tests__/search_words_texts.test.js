import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('words in texts search test', () => {
  describe('POST /searchWordsInTexts', () => {
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
    const searchItems = [
      {
        uuids: ['uuid'],
        type: 'form',
        numWordsBefore: '2',
      },
      {
        uuids: ['uuid'],
        type: 'form',
        numWordsBefore: '5',
      },
    ];
    const query = {
      items: JSON.stringify(searchItems),
      page: '1',
      rows: '25',
      sequenced: 'true',
    };

    const sendRequest = () => request(app).post(PATH).send(query);

    it('returns search results', async () => {
      const response = await sendRequest();
      expect(TextDiscourseDao.wordsInTextsSearch).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(wordsInTextsSearchResponse);
    });
  });
  describe('GET /dictItems', () => {
    const PATH = `${API_PATH}/dictItems`;

    const dictItemComboboxDisplay = [
      {
        info: {
          uuid: 'uuid',
          name: 'name',
          referenceUuid: 'referenceUuid',
          type: 'form',
        },
        display: 'display',
      },
    ];

    const DictionaryWordDao = {
      getDictItemsForWordsInTexts: jest
        .fn()
        .mockResolvedValue(dictItemComboboxDisplay),
    };

    beforeEach(() => {
      sl.set('DictionaryWordDao', DictionaryWordDao);
    });

    const sendRequest = () => request(app).get(PATH);

    it('returns words and forms', async () => {
      const response = await sendRequest();
      expect(DictionaryWordDao.getDictItemsForWordsInTexts).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(dictItemComboboxDisplay);
    });
  });
});
