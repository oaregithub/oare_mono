import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('search test', () => {
  describe('GET /search/spellings', () => {
    const PATH = `${API_PATH}/search/spellings?spelling=fakeSpelling`;
    const searchResults = [
      {
        wordUuid: 'word-uuid',
        word: 'word',
        form: {
          uuid: 'form-uuid',
          form: 'form',
        },
      },
    ];
    const DictionaryWordDao = {
      searchSpellings: jest.fn().mockResolvedValue(searchResults),
    };

    const setup = () => {
      sl.set('DictionaryWordDao', DictionaryWordDao);
    };

    const sendRequest = () => request(app).get(PATH);

    it('returns search results', async () => {
      setup();
      const response = await sendRequest();

      expect(DictionaryWordDao.searchSpellings).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(searchResults);
    });

    it('returns 500 when search fails', async () => {
      sl.set('DictionaryWordDao', {
        searchSpellings: jest
          .fn()
          .mockRejectedValue('Failed to search spellings'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /search/spellings/discourse', () => {
    const spelling = 'fakeSpelling';
    const PATH = `${API_PATH}/search/spellings/discourse?spelling=${spelling}`;
    const textName = 'Example text';
    const searchRows = [
      {
        textName,
        textUuid: 'text-uuid',
        line: 1,
        wordOnTablet: 10,
      },
    ];

    const textReadings = [
      {
        wordOnTablet: 10,
        spelling: 'fakeSpelling',
      },
    ];

    const TextDiscourseDao = {
      searchTextDiscourseSpellings: jest.fn().mockResolvedValue({
        rows: searchRows,
        totalResults: searchRows.length,
      }),
      getTextSpellings: jest.fn().mockResolvedValue(textReadings),
    };

    const setup = () => {
      sl.set('TextDiscourseDao', TextDiscourseDao);
    };

    const sendRequest = () => request(app).get(PATH);

    beforeEach(setup);

    it('returns 200 on success', async () => {
      const response = await sendRequest();

      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        totalResults: searchRows.length,
        rows: [
          {
            line: 1,
            textName,
            textUuid: 'text-uuid',
            wordOnTablet: 10,
            readings: [
              {
                spelling: 'fakeSpelling',
                wordOnTablet: 10,
              },
            ],
          },
        ],
      });
    });

    it('calls appropriate DAOs', async () => {
      await sendRequest();

      expect(
        TextDiscourseDao.searchTextDiscourseSpellings
      ).toHaveBeenCalledWith(spelling, { limit: 10, page: 1 });
      expect(TextDiscourseDao.getTextSpellings).toHaveBeenCalledWith(
        'text-uuid'
      );
    });

    it('returns 500 if searching spellings fails', async () => {
      sl.set('TextDiscourseDao', {
        ...TextDiscourseDao,
        searchTextDiscourseSpellings: jest
          .fn()
          .mockRejectedValue('Failed to search discourse spellings'),
      });
      const response = await sendRequest();

      expect(response.status).toBe(500);
    });

    it('returns 500 if get text spellings fails', async () => {
      sl.set('TextDiscourseDao', {
        ...TextDiscourseDao,
        getTextSpellings: jest
          .fn()
          .mockRejectedValue('Cannot get text spellings'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
