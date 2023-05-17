import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import { getSubscriptVowelOptions } from '@/daos/SignReadingDao/utils';

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
      searchTexts: jest.fn().mockResolvedValue(matchingTexts),
      getEpigraphicUnits: jest.fn().mockResolvedValue([]),
    };

    const TextDao = {
      getTextByUuid: jest.fn().mockResolvedValue(null),
    };

    const SignReadingDao = {
      getIntellisearchSignUuids: jest
        .fn()
        .mockResolvedValue(['mockSignReadingUuid']),
      hasSign: jest.fn().mockResolvedValue(true),
      getMatchingSigns: jest.fn().mockResolvedValue(['lì']),
    };

    beforeEach(() => {
      sl.set('SignReadingDao', SignReadingDao);
      sl.set('TextEpigraphyDao', TextEpigraphyDao);
      sl.set('TextDao', TextDao);
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
        results: matchingTexts.map(text => ({
          ...text,
          name: '',
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
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['áš'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['ḫù'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['ŠU'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['ṭum'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['ṣé'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['ḪU'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['tàm'],
        undefined
      );
      expect(response.status).toBe(200);
    });

    it('normalizes numbers', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: '2AŠ-3-4DIŠ-12AŠ-23DIŠ-34-1/2',
        });
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['2AŠ'],
        undefined
      ); // 2AŠ
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['3DIŠ'],
        undefined
      ); // 3
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['4DIŠ'],
        undefined
      ); // 4DIŠ
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['1U'],
        undefined
      ); // 12AŠ
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['2AŠ'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['2U'],
        undefined
      ); // 23DIŠ;
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['3DIŠ'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['3U'],
        undefined
      ); // 34
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['4DIŠ'],
        undefined
      );
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        ['½'],
        undefined
      ); // 1/2
      expect(response.status).toBe(200);
    });

    it('parses intellisearch consonant wildcard (C)', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: 'Cum-IŠCAR',
        });
      const consonants = 'bdgklmnpqrstwyzBDGKLMNPQRSTWYZšṣṭḫṢŠṬḪ'.split('');
      // Cum
      const firstSearchArray = consonants.map(consonant => `${consonant}um`);
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        firstSearchArray,
        undefined
      );

      // IŠCAR
      const secondSearchArray = consonants.map(consonant => `IŠ${consonant}AR`);
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        secondSearchArray,
        undefined
      );
      expect(response.status).toBe(200);
    });

    it('parses intellisearch ampersand wildcard (&)', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: '&tam-&tu',
        });
      const subscriptVowelOptions = getSubscriptVowelOptions();

      // &tam
      const firstSignAccentedVowels = ['tam', 'tám', 'tàm'];
      const firstSignSubscriptVowels = subscriptVowelOptions.map(
        vowel => `tam${vowel}`
      );
      const firstSignPossibleVowels = [
        ...firstSignAccentedVowels,
        ...firstSignSubscriptVowels,
      ];
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        firstSignPossibleVowels,
        undefined
      );

      // &tu
      const secondSignAccentedVowels = ['tu', 'tú', 'tù'];
      const secondSignSubscriptVowels = subscriptVowelOptions.map(
        vowel => `tu${vowel}`
      );
      const secondSignPossibleVowels = [
        ...secondSignAccentedVowels,
        ...secondSignSubscriptVowels,
      ];
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        secondSignPossibleVowels,
        undefined
      );

      expect(response.status).toBe(200);
    });

    it('parses intellisearch brackets ([])', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: '[tm]u[rm]-[bdn]a',
        });

      // [tm]u[rm]
      const firstSignArray = ['tur', 'tum', 'mur', 'mum'];
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        firstSignArray,
        undefined
      );

      // [bdn]a
      const secondSignArray = ['ba', 'da', 'na'];
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        secondSignArray,
        undefined
      );

      expect(response.status).toBe(200);
    });

    it('parses intellisearch dollar sign ($)', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: '$lì-$lam₅-tam',
        });

      expect(SignReadingDao.getMatchingSigns).toHaveBeenCalledTimes(2);
      expect(SignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledTimes(3);

      expect(response.status).toBe(200);
    });

    it('returns 500 if searching texts fails', async () => {
      sl.set('TextEpigraphyDao', {
        ...TextEpigraphyDao,
        searchTexts: jest.fn().mockRejectedValue('Failed to search texts'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if getting matching lines', async () => {
      sl.set('TextDao', {
        ...TextDao,
        getTextByUuid: jest.fn().mockRejectedValue('Failed to get text'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /search/count', () => {
    const PATH = `${API_PATH}/search/count`;

    const TextEpigraphyDao = {
      searchTextsTotal: jest.fn().mockResolvedValue(10),
    };

    const SignReadingDao = {
      getIntellisearchSignUuids: jest
        .fn()
        .mockResolvedValue(['mockSignReadingUuid']),
      hasSign: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      sl.set('TextEpigraphyDao', TextEpigraphyDao);
      sl.set('SignReadingDao', SignReadingDao);
    });

    const query = {
      characters: 'a-na',
      title: 'CCT',
    };

    const sendRequest = () => request(app).get(PATH).query(query);

    it('returns search count', async () => {
      const response = await sendRequest();
      expect(TextEpigraphyDao.searchTextsTotal).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(10);
    });

    it('returns 500 on failed search count', async () => {
      sl.set('TextEpigraphyDao', {
        ...TextEpigraphyDao,
        searchTextsTotal: jest
          .fn()
          .mockRejectedValue('Failed to retrieve search total'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /search/discourse/null', () => {
    const PATH = `${API_PATH}/search/discourse/null`;
    const query = {
      page: 1,
      limit: 50,
      characters: 'a-na',
    };

    const mockTextEpigraphyDao = {
      searchNullDiscourse: jest.fn().mockResolvedValue([
        {
          textUuid: 'testUuid',
          epigraphyUuids: ['epigUuid1', 'epigUuid2'],
          line: 1,
        },
      ]),
      getEpigraphicUnits: jest.fn().mockResolvedValue([]),
    };
    const mockTextDao = {
      getTextByUuid: jest.fn().mockResolvedValue({
        name: 'testName',
      }),
    };
    const mockSignReadingDao = {
      getIntellisearchSignUuids: jest
        .fn()
        .mockResolvedValue(['mockSignReadingUuid']),
    };

    beforeEach(() => {
      sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
      sl.set('TextDao', mockTextDao);
      sl.set('SignReadingDao', mockSignReadingDao);
    });

    const sendRequest = () => request(app).get(PATH).query(query);

    it('successfully returns results with no discourse', async () => {
      const response = await sendRequest();
      expect(mockTextEpigraphyDao.searchNullDiscourse).toHaveBeenCalled();
      expect(JSON.parse(response.text)).toEqual([
        {
          textUuid: 'testUuid',
          epigraphyUuids: ['epigUuid1', 'epigUuid2'],
          line: 1,
          textName: 'testName',
          reading: '',
        },
      ]);
      expect(response.status).toBe(200);
    });

    it('returns 500 on failed search', async () => {
      sl.set('TextEpigraphyDao', {
        ...mockTextEpigraphyDao,
        searchNullDiscourse: jest
          .fn()
          .mockRejectedValue('failed to search null discourse'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 on failed text name retrieval', async () => {
      sl.set('TextDao', {
        ...mockTextDao,
        getTextByUuid: jest.fn().mockRejectedValue('failed to get text info'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 on failed line rendering', async () => {
      sl.set('TextEpigraphyDao', {
        ...mockTextEpigraphyDao,
        getEpigraphicUnits: jest
          .fn()
          .mockRejectedValue('failed to get epigraphic units'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /search/discourse/null/count', () => {
    const PATH = `${API_PATH}/search/discourse/null/count`;
    const query = { characters: 'a-na' };

    const mockTextEpigraphyDao = {
      searchNullDiscourseCount: jest.fn().mockResolvedValue(1),
    };
    const mockSignReadingDao = {
      getIntellisearchSignUuids: jest
        .fn()
        .mockResolvedValue(['mockSignReadingUuid']),
    };

    beforeEach(() => {
      sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
      sl.set('SignReadingDao', mockSignReadingDao);
    });

    const sendRequest = () => request(app).get(PATH).query(query);

    it('successfully gets null discourse search count', async () => {
      const response = await sendRequest();
      expect(JSON.parse(response.text)).toEqual(1);
      expect(response.status).toBe(200);
    });

    it('returns 500 on failed null discourse search count', async () => {
      sl.set('TextEpigraphyDao', {
        ...mockTextEpigraphyDao,
        searchNullDiscourseCount: jest
          .fn()
          .mockRejectedValue('failed to get null discourse count'),
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
