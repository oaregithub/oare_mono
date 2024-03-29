import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockGETCollectionTexts = {
  totalTexts: 2,
  texts: [
    {
      id: 'id1',
      uuid: 'uuid1',
      name: 'name1',
      hasEpigraphy: true,
      type: 'type1',
    },
    {
      id: 'id2',
      uuid: 'uuid2',
      name: 'name2',
      hasEpigraphy: true,
      type: 'type2',
    },
  ],
};

describe('GET /collections', () => {
  const PATH = `${API_PATH}/collections`;
  const collectionUuid = 'collection-uuid';
  const collection = {
    uuid: collectionUuid,
    name: 'collection name',
  };

  const mockCollectionDao = {
    getAllCollections: jest.fn().mockResolvedValue([collectionUuid]),
    getCollectionByUuid: jest.fn().mockResolvedValue(collection),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('CollectionDao', mockCollectionDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful collections retrieval', async () => {
    const response = await sendRequest();
    expect(mockCollectionDao.getAllCollections).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed collections retrieval', async () => {
    sl.set('CollectionDao', {
      ...mockCollectionDao,
      getAllCollections: jest
        .fn()
        .mockRejectedValue('failed collections retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed collection retrieval by uuid', async () => {
    sl.set('CollectionDao', {
      ...mockCollectionDao,
      getCollectionByUuid: jest
        .fn()
        .mockRejectedValue('failed to get collection'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /collections/:uuid', () => {
  const uuid = 'mockUuid';
  const PATH = `${API_PATH}/collections/${uuid}`;

  const mockCollectionTextUtils = {
    canViewCollection: jest.fn().mockResolvedValue(true),
  };

  const mockHierarchyDao = {
    getCollectionTexts: jest.fn().mockResolvedValue(mockGETCollectionTexts),
  };

  const mockUtils = {
    extractPagination: jest
      .fn()
      .mockReturnValue({ filter: '', limit: 10, page: 1 }),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('CollectionTextUtils', mockCollectionTextUtils);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('utils', mockUtils);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful collection text retrieval', async () => {
    const response = await sendRequest();
    expect(mockHierarchyDao.getCollectionTexts).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed collection texts retrieval', async () => {
    sl.set('HierarchyDao', {
      getCollectionTexts: jest
        .fn()
        .mockRejectedValue('failed collection texts retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 if canViewCollection fails', async () => {
    sl.set('CollectionTextUtils', {
      ...mockCollectionTextUtils,
      canViewCollection: jest
        .fn()
        .mockRejectedValue('failed to check if can view collection'),
    });

    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 403 if collection is forbidden', async () => {
    sl.set('CollectionTextUtils', {
      ...mockCollectionTextUtils,
      canViewCollection: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });
});
