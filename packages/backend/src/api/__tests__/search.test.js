import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import { getSubscriptVowelOptions } from '../daos/SignReadingDao/utils';

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
      // Rendering a proper line reading is out of the scope of this test
      getEpigraphicUnits: jest.fn().mockResolvedValue([]),
    };

    const TextDao = {
      getTextByUuid: jest.fn().mockResolvedValue({
        name: 'Test Text',
      }),
    };

    const mockSignReadingDao = {
      getIntellisearchSignUuids: jest
        .fn()
        .mockResolvedValue(['mockSignReadingUuid']),
      hasSign: jest.fn().mockResolvedValue(true),
      getMatchingSigns: jest.fn().mockResolvedValue(['lì']),
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
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['áš']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['ḫù']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['ŠU']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['ṭum']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['ṣé']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['ḪU']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['tàm']);
      expect(response.status).toBe(200);
    });

    it('normalizes numbers', async () => {
      const response = await request(app)
        .get(PATH)
        .query({
          ...query,
          characters: '2AŠ-3-4DIŠ-12AŠ-23DIŠ-34-1/2',
        });
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['2AŠ']); // 2AŠ
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['3DIŠ']); // 3
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['4DIŠ']); // 4DIŠ
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['1U']); // 12AŠ
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['2AŠ']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['2U']); // 23DIŠ;
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['3DIŠ']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['3U']); // 34
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['4DIŠ']);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledWith(['½']); // 1/2
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
      expect(mockSignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        firstSearchArray
      );

      // IŠCAR
      const secondSearchArray = consonants.map(consonant => `IŠ${consonant}AR`);
      expect(mockSignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        secondSearchArray
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
      expect(mockSignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        firstSignPossibleVowels
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
      expect(mockSignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        secondSignPossibleVowels
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
      expect(mockSignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        firstSignArray
      );

      // [bdn]a
      const secondSignArray = ['ba', 'da', 'na'];
      expect(mockSignReadingDao.getIntellisearchSignUuids).toHaveBeenCalledWith(
        secondSignArray
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

      expect(mockSignReadingDao.getMatchingSigns).toHaveBeenCalledTimes(2);
      expect(
        mockSignReadingDao.getIntellisearchSignUuids
      ).toHaveBeenCalledTimes(3);

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

  describe('GET /search/count', () => {
    const PATH = `${API_PATH}/search/count`;

    const mockTextEpigraphyDao = {
      searchTextsTotal: jest.fn().mockResolvedValue(10),
    };

    const mockSignReadingDao = {
      getIntellisearchSignUuids: jest
        .fn()
        .mockResolvedValue(['mockSignReadingUuid']),
      hasSign: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
      sl.set('SignReadingDao', mockSignReadingDao);
    });

    const query = {
      characters: 'a-na',
      title: 'CCT',
    };

    const sendRequest = () => request(app).get(PATH).query(query);

    it('returns search count', async () => {
      const response = await sendRequest();
      expect(mockTextEpigraphyDao.searchTextsTotal).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(10);
    });

    it('returns 500 on failed search count', async () => {
      sl.set('TextEpigraphyDao', {
        ...mockTextEpigraphyDao,
        searchTextsTotal: jest
          .fn()
          .mockRejectedValue('failed to retrieve search total'),
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
