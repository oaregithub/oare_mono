import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('people api test', () => {
  const mockStore = {
    getters: {
      user: {
        uuid: 'testUuid',
      },
      permissions: [
        {
          name: 'PERSON',
        },
      ],
      isAdmin: true,
    },
  };

  const mockCache = {
    insert: jest.fn(),
  };

  const allPeople = [
    {
      uuid: 'test1',
    },
    {
      uuid: 'test2',
    },
  ];

  const allPeopleExpectedResponse = [
    {
      uuid: 'test1',
      totalReferenceCount: 2,
    },
    {
      uuid: 'test2',
      totalReferenceCount: 3,
    },
  ];

  const uuidsByPersonFirstCall = ['person1uuid1', 'person1uuid2'];
  const uuidsByPersonSecondCall = [
    'person2uuid1',
    'person2uuid2',
    'person2uuid3',
  ];

  const mockPersonDao = {
    getAllPeople: jest.fn().mockResolvedValue(allPeople),
    getSpellingUuidsByPerson: jest
      .fn()
      .mockResolvedValueOnce(uuidsByPersonFirstCall)
      .mockResolvedValueOnce(uuidsByPersonSecondCall),
  };

  const mockTextDiscourseDao = {
    getTotalSpellingTexts: jest.fn().mockResolvedValue(1),
  };

  const mockUserDao = {
    getUserByEmail: jest.fn().mockResolvedValue({
      uuid: 'testUuid',
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'PEOPLE',
        type: 'pages',
      },
    ]),
  };

  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('store', mockStore);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  describe('GET /people/:letter', () => {
    const letter = 'a';
    const PATH = `${API_PATH}/people/${encodeURIComponent(letter)}`;

    const sendRequest = async (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns successful people.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(allPeopleExpectedResponse);
      expect(mockPersonDao.getSpellingUuidsByPerson).toHaveBeenCalledTimes(
        allPeople.length
      );
      expect(mockTextDiscourseDao.getTotalSpellingTexts).toHaveBeenCalledTimes(
        uuidsByPersonFirstCall.length + uuidsByPersonSecondCall.length
      );
      expect(mockCache.insert).toHaveBeenCalled();
    });

    it('fails to return people when getting people fails.', async () => {
      sl.set('PersonDao', {
        getAllPeople: jest
          .fn()
          .mockRejectedValue('Error, people unable to be retrieved.'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(mockCache.insert).not.toHaveBeenCalled();
    });

    it('fails to return people when getting spellings of people fails.', async () => {
      sl.set('PersonDao', {
        getSpellingUuidsByPerson: jest
          .fn()
          .mockRejectedValue(
            'Error, spellings of people unable to be retrieved.'
          ),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(mockCache.insert).not.toHaveBeenCalled();
    });

    it('fails to return people when getting total text occurrences of people fails.', async () => {
      sl.set('TextDiscourseDao', {
        getTotalSpellingTexts: jest
          .fn()
          .mockRejectedValue(
            'Error, total text occurrences unable to be retrieved.'
          ),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(mockCache.insert).not.toHaveBeenCalled();
    });
  });
});
