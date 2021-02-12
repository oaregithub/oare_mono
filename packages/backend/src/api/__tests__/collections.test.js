import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockGETCollections = [
  {
    name: 'name1',
    uuid: 'uuid1',
  },
  {
    name: 'name2',
    uuid: 'uuid2',
  },
];

const mockGETCollectionTexts = {
  totalTexts: 2,
  isForbidden: false,
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
  const mockHierarchyDao = {
    getAllCollections: jest.fn().mockResolvedValue(mockGETCollections),
  };

  const setup = () => {
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('returns 200 on successful collections retrieval', async () => {
    const response = await sendRequest();
    expect(mockHierarchyDao.getAllCollections).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed collections retrieval', async () => {
    sl.set('HierarchyDao', {
      getAllCollections: jest
        .fn()
        .mockRejectedValue('failed collections retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /collections/:uuid', () => {
  const uuid = 'mockUuid';
  const PATH = `${API_PATH}/collections/${uuid}`;
  const mockHierarchyDao = {
    getCollectionTexts: jest.fn().mockResolvedValue(mockGETCollectionTexts),
  };

  const setup = () => {
    sl.set('HierarchyDao', mockHierarchyDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

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

  it('returns 403 if collection is forbidden', async () => {
    sl.set('HierarchyDao', {
      getCollectionTexts: jest.fn().mockResolvedValue({
        ...mockGETCollectionTexts,
        isForbidden: true,
      }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });
});
