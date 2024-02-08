import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /persons/:letter', () => {
  const letter = 'A';
  const PATH = `${API_PATH}/persons/${letter}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'PERSONS',
      },
    ]),
  };

  const mockPersonDao = {
    getPersonUuidsByLetterGroup: jest
      .fn()
      .mockResolvedValue(['test-person-uuid']),
    getPersonCoreByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('PersonDao', mockPersonDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 when successfully retrieves persons by letter', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonUuidsByLetterGroup).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 when fails to retrieve persons by letter', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonUuidsByLetterGroup: jest
        .fn()
        .mockRejectedValue('failed to retrieve persons by letter'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /persons/occurrences/count', () => {
  const roleUuid = 'test-role-uuid';
  const personUuid = 'test-person-uuid';
  const PATH = `${API_PATH}/persons/occurrences/count?roleUuid=${roleUuid}&personsUuids[]=${personUuid}`;

  const mockUtils = {
    extractPagination: jest
      .fn()
      .mockReturnValue({ filter: '', limit: 10, page: 1 }),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'PERSONS' }]),
  };

  const mockPersonDao = {
    getPersonOccurrencesCount: jest.fn().mockResolvedValue(1),
  };

  const setup = () => {
    sl.set('utils', mockUtils);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('PersonDao', mockPersonDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 when successfully retrieves persons occurrences count', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonOccurrencesCount).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if fails to retrieve persons occurrences count', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonOccurrencesCount: jest
        .fn()
        .mockRejectedValue('failed to retrieve persons occurrences count'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /persons/occurrences/texts', () => {
  const roleUuid = 'test-role-uuid';
  const personUuid = 'test-person-uuid';
  const PATH = `${API_PATH}/persons/occurrences/texts?roleUuid=${roleUuid}&personsUuids[]=${personUuid}`;

  const mockUtils = {
    extractPagination: jest
      .fn()
      .mockReturnValue({ filter: '', limit: 10, page: 1 }),
    getTextOccurrences: jest.fn().mockResolvedValue([]),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'PERSONS' }]),
  };

  const mockPersonDao = {
    getPersonOccurrencesTexts: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('utils', mockUtils);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('PersonDao', mockPersonDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 when successfully retrieves persons occurrences texts', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonOccurrencesTexts).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if fails to retrieve persons occurrences texts', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonOccurrencesTexts: jest
        .fn()
        .mockRejectedValue('failed to retrieve persons occurrences texts'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /persons/disconect/:personUuid/:discourseUuid', () => {
  const personUuid = 'test-person-uuid';
  const discourseUuid = 'test-discourse-uuid';
  const PATH = `${API_PATH}/persons/disconnect/${personUuid}/${discourseUuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'DISCONNECT_OCCURRENCES' }]),
  };

  const mockItemPropertiesDao = {
    deleteItemPropertyRowsByReferenceUuidAndObjectUuid: jest
      .fn()
      .mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).delete(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 204 when successfully disconnects person from discourse', async () => {
    const response = await sendRequest();
    expect(
      mockItemPropertiesDao.deleteItemPropertyRowsByReferenceUuidAndObjectUuid
    ).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if fails to disconnect person from discourse', async () => {
    sl.set('ItemPropertiesDao', {
      ...mockItemPropertiesDao,
      deleteItemPropertyRowsByReferenceUuidAndObjectUuid: jest
        .fn()
        .mockRejectedValue('failed to disconnect person from discourse'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /person/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/person/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([{ name: 'PERSONS' }]),
  };

  const mockPersonDao = {
    getPersonByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('PersonDao', mockPersonDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 when successfully retrieves person', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if fails to retrieve person', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonByUuid: jest.fn().mockRejectedValue('failed to retrieve person'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
