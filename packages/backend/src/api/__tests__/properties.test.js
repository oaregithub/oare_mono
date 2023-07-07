import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /properties/:referenceUuid', () => {
  const referenceUuid = 'test-reference-uuid';
  const PATH = `${API_PATH}/properties/${referenceUuid}`;

  const mockItemPropertiesDao = {
    getItemPropertiesByReferenceUuid: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful item properties retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed item properties retrieval', async () => {
    sl.set('ItemPropertiesDao', {
      ...mockItemPropertiesDao,
      getItemPropertiesByReferenceUuid: jest
        .fn()
        .mockRejectedValue('Failed to retrieve item properties'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /properties/:referenceUuid', () => {
  const referenceUuid = 'test-reference-uuid';
  const PATH = `${API_PATH}/properties/${referenceUuid}`;

  const mockBody = {
    properties: [],
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'EDIT_ITEM_PROPERTIES' }]),
  };

  const mockItemPropertiesDao = {
    deleteItemPropertyRowsByReferenceUuid: jest.fn().mockResolvedValue(),
    insertItemPropertyRows: jest.fn().mockResolvedValue(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).patch(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 204 on successful item properties update', async () => {
    const response = await sendRequest();
    expect(
      mockItemPropertiesDao.deleteItemPropertyRowsByReferenceUuid
    ).toHaveBeenCalled();
    expect(mockItemPropertiesDao.insertItemPropertyRows).toHaveBeenCalled();
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

  it('returns 500 on failed item properties update', async () => {
    sl.set('ItemPropertiesDao', {
      ...mockItemPropertiesDao,
      insertItemPropertyRows: jest
        .fn()
        .mockRejectedValue('Failed to update item properties'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /properties_taxonomy_tree', () => {
  const PATH = `${API_PATH}/properties_taxonomy_tree`;

  const mockHierarchyDao = {
    createPropertiesTaxonomyTree: jest.fn().mockResolvedValue(),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful properties taxonomy tree retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed properties taxonomy tree retrieval', async () => {
    sl.set('HierarchyDao', {
      ...mockHierarchyDao,
      createPropertiesTaxonomyTree: jest
        .fn()
        .mockRejectedValue('Failed to retrieve properties taxonomy tree'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /properties_links', () => {
  const tableReference = 'dictionary_word';
  const search = 'test-search';
  const PATH = `${API_PATH}/properties_links?tableReference=${tableReference}&search=${search}`;

  const mockDictionaryWordDao = {
    searchDictionaryWordsLinkProperties: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('DictionaryWordDao', mockDictionaryWordDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful properties links retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed properties links retrieval', async () => {
    sl.set('DictionaryWordDao', {
      ...mockDictionaryWordDao,
      searchDictionaryWordsLinkProperties: jest
        .fn()
        .mockRejectedValue('Failed to retrieve properties links'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
