import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('search test', () => {
  describe('GET /search', () => {
    const PATH = `${API_PATH}/search`;
    const matchingTexts = [
      {
        uuid: 'textUuid',
        lines: [1],
      },
    ];
    const TextEpigraphyDao = {
      searchTextsTotal: jest.fn().mockResolvedValue(1),
      searchTexts: jest.fn().mockResolvedValue(matchingTexts),
      // Rendering a proper line reading is out of the scope of this test
      getEpigraphicUnits: jest.fn().mockResolvedValue([]),
    };

    const TextDao = {
      getTextByUuid: jest.fn().mockResolvedValue({
        name: 'Test Text',
      }),
    };

    const mockSignReadingDao = {
      getUuidsBySignArray: jest.fn().mockResolvedValue(['mockSignReadingUuid']),
      hasSign: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      sl.set('TextEpigraphyDao', TextEpigraphyDao);
      sl.set('TextDao', TextDao);
      sl.set('SignReadingDao', mockSignReadingDao);
    });

    const query = {
      characters: 'a-na',
      title: 'CCT',
      page: 1,
      rows: 10,
    };

    const sendRequest = () => request(app).get(PATH).query(query);

    it('returns search results', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        totalRows: 1,
        results: matchingTexts.map(text => ({
          ...text,
          name: 'Test Text',
          matches: [''],
        })),
      });
    });

    it('normalizes consonants and vowels', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: 'asz2-hu3-SZU-t,um-s,e2-HU-tam3',
        });
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        'áš',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        'ḫù',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        'ŠU',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        'ṭum',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        'ṣé',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        'ḪU',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        'tàm',
      ]);
      expect(response.status).toBe(200);
    });

    it('normalizes numbers', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: '2AŠ-3-4DIŠ-12AŠ-23DIŠ-34-1/2',
        });
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '2AŠ',
      ]); // 2AŠ
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '3DIŠ',
      ]); // 3
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '4DIŠ',
      ]); // 4DIŠ
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '1U',
      ]); // 12AŠ
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '2AŠ',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '2U',
      ]); // 23DIŠ;
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '3DIŠ',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '3U',
      ]); // 34
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '4DIŠ',
      ]);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith([
        '½',
      ]); // 1/2
      expect(response.status).toBe(200);
    });

    it('parses intellisearch wildcard (*)', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: '*um-IŠ*AR',
        });
      const consonants = 'bdgklmnpqrstwyzBDGKLMNPQRSTWYZšṣṭḫṢŠṬḪ'.split('');
      // *um
      const firstSearchArray = consonants.map(consonant => `${consonant}um`);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith(
        firstSearchArray
      );

      // IŠ*AR
      const secondSearchArray = consonants.map(consonant => `IŠ${consonant}AR`);
      expect(mockSignReadingDao.getUuidsBySignArray).toHaveBeenCalledWith(
        secondSearchArray
      );
      expect(response.status).toBe(200);
    });

    it('returns 500 if searching total results fails', async () => {
      sl.set('TextEpigraphyDao', {
        ...TextEpigraphyDao,
        searchTextsTotal: jest
          .fn()
          .mockRejectedValue('Failed to search texts total'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if searching texts fails', async () => {
      sl.set('TextEpigraphyDao', {
        ...TextEpigraphyDao,
        searchTexts: jest.fn().mockRejectedValue('Failed to search texts'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if getting text by uuid fails', async () => {
      sl.set('TextDao', {
        ...TextDao,
        getTextByUuid: jest.fn().mockRejectedValue('Failed to get text'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if getting epigraphic units fails', async () => {
      sl.set('TextEpigraphyDao', {
        ...TextEpigraphyDao,
        getEpigraphicUnits: jest
          .fn()
          .mockRejectedValue('Failed to get epig units'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

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
