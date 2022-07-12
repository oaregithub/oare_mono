import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /collection_info/:uuid', () => {
  const uuid = 'mockUuid';
  const PATH = `${API_PATH}/collection_info/${uuid}`;
  const collection = {
    uuid: 'uuid',
    name: 'collection name',
  };
  const mockCollectionDao = {
    getCollectionByUuid: jest.fn().mockResolvedValue(collection),
  };
  const mockHierarchyDao = {
    isPublished: jest.fn().mockResolvedValue(true),
  };
  const mockCollectionTextUtils = {
    canViewCollection: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('CollectionDao', mockCollectionDao);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('CollectionTextUtils', mockCollectionTextUtils);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue(),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful collection info retrieval', async () => {
    const response = await sendRequest();
    expect(mockCollectionDao.getCollectionByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 400 when given non-existent collection UUID', async () => {
    sl.set('CollectionDao', {
      ...mockCollectionDao,
      getCollectionByUuid: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 500 on failed collection info retrieval', async () => {
    sl.set('CollectionDao', {
      ...mockCollectionDao,
      getCollectionByUuid: jest
        .fn()
        .mockRejectedValue('Failed to get collection'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
