import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockPermissionsDao = {
  getUserPermissions: jest
    .fn()
    .mockResolvedValue([
      { name: 'PERSONS' },
      { name: 'DISCONNECT_OCCURRENCES' },
    ]),
};

const mockUserDao = {
  getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
};

const mockUtils = {
  extractPagination: jest
    .fn()
    .mockReturnValue({ filter: '', limit: 10, page: 1 }),
};

describe('GET /persons/:letter', () => {
  const letter = 'A';
  const PATH = `${API_PATH}/persons/${letter}`;
  const personRow = {
    uuid: 'Test-uuid',
    nameUuid: 'Test-name-uuid',
    relation: 's.',
    relationNameUuid: 'Test-rel-name-uuid',
    label: 'test-label',
    type: 'test-type',
  };

  const mockPersonDao = {
    getPersonsRowsByLetter: jest.fn().mockResolvedValue([personRow]),
  };

  const mockDictionaryWordDao = {
    getDictionaryWordRowByUuid: jest
      .fn()
      .mockResolvedValue({ word: 'test-word' }),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn((_key, response, _filter) => response),
  };
  const mockItemPropertiesDao = {
    getPropertiesByReferenceUuid: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('UserDao', mockUserDao);
    sl.set('cache', mockCache);
    sl.set('DictionaryWordDao', mockDictionaryWordDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };
  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('Returns 200 in successful retrieval - case 1', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonsRowsByLetter).toHaveBeenCalled();
    expect(
      mockItemPropertiesDao.getPropertiesByReferenceUuid
    ).toHaveBeenCalled();
    expect(mockDictionaryWordDao.getDictionaryWordRowByUuid).toHaveBeenCalled();
    expect(mockCache.insert).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual([
      {
        person: personRow,
        display: 'test-word s. test-word',
        properties: [],
      },
    ]);
  });

  it('Returns 200 in successful retrieval - case 2', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonsRowsByLetter: jest.fn().mockResolvedValue([
        {
          ...personRow,
          nameUuid: null,
        },
      ]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual([
      {
        person: {
          ...personRow,
          nameUuid: null,
        },
        display: 'test-label',
        properties: [],
      },
    ]);
  });

  it('Returns 200 in successful retrieval - case 3', async () => {
    sl.set('DictionaryWordDao', {
      ...mockDictionaryWordDao,
      getDictionaryWordRowByUuid: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual([
      {
        person: personRow,
        display: 'test-label',
        properties: [],
      },
    ]);
  });

  it('Returns 401 if user not logged in', async () => {
    const response = await sendRequest(false);
    expect(mockPersonDao.getPersonsRowsByLetter).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('Returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockPersonDao.getPersonsRowsByLetter).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('Returns 500 in a failed retrieval', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonsRowsByLetter: jest
        .fn()
        .mockRejectedValue('Failed content retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /persons/occurrences/count', () => {
  const PATH = `${API_PATH}/persons/occurrences/count`;
  const mockBody = ['test-uuid'];

  const mockPersonDao = {
    getPersonOccurrencesCount: jest.fn().mockResolvedValue(42),
  };

  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).post(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('Returns 200 in successful retrieval', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonOccurrencesCount).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('Returns 401 if user not logged in', async () => {
    const response = await sendRequest(false);
    expect(mockPersonDao.getPersonOccurrencesCount).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('Returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockPersonDao.getPersonOccurrencesCount).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('Returns 500 in a failed retrieval', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonOccurrencesCount: jest
        .fn()
        .mockRejectedValue('Failed content retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /persons/occurrences/texts', () => {
  const PATH = `${API_PATH}/persons/occurrences/texts`;

  const textOccurrencesRow = {
    discourseUuid: 'test-uuid',
    textName: 'test-name',
    textUuid: 'test-text-uuid',
  };

  const mockPersonDao = {
    getPersonOccurrencesTexts: jest
      .fn()
      .mockResolvedValue([textOccurrencesRow]),
  };
  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
    sl.set('utils', {
      ...mockUtils,
      getTextOccurrences: jest.fn().mockResolvedValue([
        {
          ...textOccurrencesRow,
          discourseUuidsToHighlight: [],
          readings: [],
        },
      ]),
    });
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('Returns 200 in successful retrieval', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonOccurrencesTexts).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('Returns 401 if user not logged in', async () => {
    const response = await sendRequest(false);
    expect(mockPersonDao.getPersonOccurrencesTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('Returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockPersonDao.getPersonOccurrencesTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('Returns 500 in a failed retrieval', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonOccurrencesTexts: jest
        .fn()
        .mockRejectedValue('Failed content retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /persons/disconnect', () => {
  const personUuid = 'test-uuid';
  const discourseUuid = 'test-uuid';
  const PATH = `${API_PATH}/persons/disconnect/${personUuid}/${discourseUuid}`;

  const mockPersonDao = {
    disconnectPerson: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).delete(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('Returns 204 in successful disconnect', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.disconnectPerson).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('Returns 401 if user not logged in', async () => {
    const response = await sendRequest(false);
    expect(mockPersonDao.disconnectPerson).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('Returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockPersonDao.disconnectPerson).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('Returns 500 in a failed disconnect', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      disconnectPerson: jest.fn().mockRejectedValue('Failed content retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /person/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/person/${uuid}`;

  const testPersonRow = {
    uuid: 'test-uuid',
    nameUuid: 'test-name-uuid',
    relation: 's.',
    relationNameUuid: 'test-rel-name-uuid',
    label: 'test-label',
    type: 'test-type',
  };

  const testPersonCore = {
    display: 'test-display',
    nameUuid: 'test-name-uuid',
    relation: 's.',
    relationNameUuid: 'test-rel-name-uuid',
    uuid: 'test-uuid',
    descriptor: 'test-descriptor',
  };

  const testPersonRole = {
    role: 'test-role',
    roleUuid: 'test-role-uuid',
  };

  const testFieldRow = {
    id: 42,
    uuid: 'test-uuid',
    reference_uuid: 'test-reference-uuid',
    type: 'test-type',
    language: 'test-language',
    primary: 1,
    field: 'test-field',
  };

  const PersonInfo = {
    person: testPersonRow,
    display: 'test-display',
    father: testPersonCore,
    mother: testPersonCore,
    asshatumWives: testPersonCore,
    amtumWives: testPersonCore,
    husbands: testPersonCore,
    siblings: testPersonCore,
    children: testPersonCore,
    durableRoles: testPersonRole,
    temporaryRoles: testPersonRole,
    discussion: testFieldRow,
  };

  const mockPersonDao = {
    getPersonInfo: jest.fn().mockResolvedValue(PersonInfo),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('PersonDao', mockPersonDao);
    sl.set('UserDao', mockUserDao);
    sl.set('cache', mockCache);
    sl.set('PermissionsDao', mockPermissionsDao);
  };
  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('Returns 200 in successful retrieval', async () => {
    const response = await sendRequest();
    expect(mockPersonDao.getPersonInfo).toHaveBeenCalled();
    expect(mockCache.insert).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('Returns 401 if user not logged in', async () => {
    const response = await sendRequest(false);
    expect(mockPersonDao.getPersonInfo).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('Returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockPersonDao.getPersonInfo).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('Returns 500 in a failed retrieval', async () => {
    sl.set('PersonDao', {
      ...mockPersonDao,
      getPersonInfo: jest.fn().mockRejectedValue('Failed content retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
