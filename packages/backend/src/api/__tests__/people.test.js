import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('people api test', () => {
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

  const person1TextOccurrenceCount = 1;
  const person2TextOccurrenceCount = 2;

  const allPeopleExpectedResponse = [
    {
      uuid: 'test1',
      textOccurrenceCount: person1TextOccurrenceCount,
    },
    {
      uuid: 'test2',
      textOccurrenceCount: person2TextOccurrenceCount,
    },
  ];

  const mockPersonDao = {
    getAllPeople: jest.fn().mockResolvedValue(allPeople),
    getAllPeopleCount: jest.fn().mockResolvedValue(allPeople.length),
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

  const mockPersonTextOccurrencesDao = {
    getAll: jest.fn().mockResolvedValue({
      [allPeople[0].uuid]: person1TextOccurrenceCount,
      [allPeople[1].uuid]: person2TextOccurrenceCount,
    }),
  };

  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('PersonTextOccurrencesDao', mockPersonTextOccurrencesDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  describe('GET /people/:letter', () => {
    const letter = 'A';

    const PATH = `${API_PATH}/people/${encodeURIComponent(letter)}`;

    const sendRequest = (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns successful people.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(allPeopleExpectedResponse);
      expect(mockPersonDao.getAllPeople).toHaveBeenCalledWith(letter);
      expect(mockPersonTextOccurrencesDao.getAll).toHaveBeenCalled();
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

    it('fails to return text occurrence counts for people.', async () => {
      sl.set('PersonTextOccurrencesDao', {
        getAll: jest
          .fn()
          .mockRejectedValue(
            'Error, unable to retrieve all text occurrence counts for the people.'
          ),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(mockCache.insert).not.toHaveBeenCalled();
    });

    it('fails to return people when does not have permission', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
      expect(mockPersonDao.getAllPeople).not.toHaveBeenCalled();
    });
  });

  describe('GET /people/:letter/count', () => {
    const PATH = `${API_PATH}/people/${encodeURIComponent('A')}/count`;
    const sendRequest = (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Cookie', 'jwt=token') : req;
    };

    it('returns successful people count.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(
        allPeopleExpectedResponse.length
      );
    });

    it('fails to return people count when unexpected error', async () => {
      sl.set('PersonDao', {
        getAllPeople: jest
          .fn()
          .mockRejectedValue('Error, people count unable to be retrieved.'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('fails to return people count when does not have permission', async () => {
      sl.set('store', {
        getters: {
          user: {
            uuid: 'testUuid',
          },
          permissions: [],
          isAdmin: false,
        },
      });
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
      expect(mockPersonDao.getAllPeople).not.toHaveBeenCalled();
    });
  });
});
