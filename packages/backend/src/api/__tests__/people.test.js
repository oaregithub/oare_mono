import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import * as utils from '@/utils';

describe('people api test', () => {
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
      textOccurrenceCount: null,
      textOccurrenceDistinctCount: null,
    },
    {
      uuid: 'test2',
      textOccurrenceCount: null,
      textOccurrenceDistinctCount: null,
    },
  ];

  const mockPersonDao = {
    getAllPeople: jest.fn().mockResolvedValue(allPeople),
    getAllPeopleCount: jest.fn().mockResolvedValue(allPeople.length),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
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

  const textsOfPerson = [
    {
      textName: 'Text1',
      discourseUuid: 'uuid1',
    },
    {
      textName: 'Text2',
      discourseUuid: 'uuid2',
    },
  ];

  const line1 = 1;
  const line2 = 2;

  const referenceUuids = ['uuid1', 'uuid2'];

  const mockItemPropertiesDao = {
    getUniqueReferenceUuidOfPerson: jest.fn().mockResolvedValue(referenceUuids),
  };

  const renderedTextsOfPerson = [
    {
      textName: textsOfPerson[0].textName,
      discourseUuid: 'uuid1',
      readings: ['8. IGI <em>e</em>', '9. DUMU <em>e</em>'],
    },
    {
      textName: textsOfPerson[1].textName,
      discourseUuid: 'uuid2',
      readings: ['11. GHI <em>i</em>', '12. DUMU <em>e</em>'],
    },
  ];

  const mockUtils = {
    extractPagination: utils.extractPagination,
    getTextOccurrences: jest.fn().mockResolvedValue(renderedTextsOfPerson),
  };

  const mockTextDiscourseDao = {
    getPersonTextsByItemPropertyReferenceUuids: jest
      .fn()
      .mockResolvedValue(textsOfPerson),
    getChildrenByParentUuid: jest.fn().mockResolvedValue([]),
    getEpigraphicLineOfWord: jest
      .fn()
      .mockResolvedValueOnce(line1)
      .mockResolvedValueOnce(line2),
    getPersonTextsByItemPropertyReferenceUuidsCount: jest
      .fn()
      .mockResolvedValue(referenceUuids.length),
  };

  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  describe('GET /people/:letter', () => {
    const letter = 'A';

    const PATH = `${API_PATH}/people/${encodeURIComponent(letter)}`;

    const sendRequest = (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Authorization', 'token') : req;
    };

    it('returns successful people.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(allPeopleExpectedResponse);
      expect(mockPersonDao.getAllPeople).toHaveBeenCalledWith(letter);
    });

    it('fails to return people when getting people fails.', async () => {
      sl.set('PersonDao', {
        getAllPeople: jest
          .fn()
          .mockRejectedValue('Error, people unable to be retrieved.'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
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

  describe('GET /people/person/:uuid/texts', () => {
    const PATH = `${API_PATH}/people/person/${encodeURIComponent(
      'uuid'
    )}/texts?limit=10&page=1`;
    const sendRequest = (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Authorization', 'token') : req;
    };

    it('returns successful person texts.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(renderedTextsOfPerson);
      expect(mockUtils.getTextOccurrences).toHaveBeenCalled();
    });

    it('fails to return person texts when invalid person.', async () => {
      sl.set('ItemPropertiesDao', {
        getAllPeople: jest
          .fn()
          .mockRejectedValue('Error, person texts unable to be retrieved.'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('fails to return person texts when does not have permission.', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
      expect(
        mockItemPropertiesDao.getUniqueReferenceUuidOfPerson
      ).not.toHaveBeenCalled();
    });
  });

  describe('GET /people/person/:uuid/occurrences', () => {
    const PATH = `${API_PATH}/people/person/${encodeURIComponent(
      'uuid'
    )}/occurrences?limit=10&page=1`;
    const sendRequest = (cookie = true) => {
      const req = request(app).get(PATH);
      return cookie ? req.set('Authorization', 'token') : req;
    };

    it('returns successful person texts count.', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(referenceUuids.length);
      expect(
        mockTextDiscourseDao.getPersonTextsByItemPropertyReferenceUuidsCount
      ).toHaveBeenCalled();
    });

    it('unable to return person texts count when count fails.', async () => {
      sl.set('TextDiscourseDao', {
        ...mockTextDiscourseDao,
        getPersonTextsByItemPropertyReferenceUuidsCount: jest
          .fn()
          .mockRejectedValue('Error, unable to return person text count.'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
