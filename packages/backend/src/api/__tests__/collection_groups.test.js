import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockGET = [
  {
    uuid: 'uuid1',
    name: 'Test1',
    canRead: false,
    canWrite: false,
  },
  {
    uuid: 'uuid2',
    name: 'Test2',
    canRead: false,
    canWrite: false,
  },
];
const mockPOST = {
  collections: [
    {
      uuid: 'uuid3',
      canRead: false,
      canWrite: false,
    },
    {
      uuid: 'uuid4',
      canRead: false,
      canWrite: false,
    },
  ],
};
const mockPATCH = {
  uuid: 'uuid1',
  canRead: true,
  canWrite: true,
};
const mockGroup = {
  id: 1,
  name: 'testGroup',
  created_on: Date.now(),
  num_users: 1,
};

describe('GET /collection_groups', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/collection_groups/${groupId}`;
  const mockCollectionGroupDao = {
    getCollections: jest.fn().mockResolvedValue(mockGET),
  };

  const setup = () => {
    sl.set('CollectionGroupDao', mockCollectionGroupDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

  it('returns 200 on successful collection group retrieval', async () => {
    const response = await sendRequest();
    expect(mockCollectionGroupDao.getCollections).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockGET);
  });

  it('does not allow non-admin user to get collection group', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockCollectionGroupDao.getCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in user to get collection group', async () => {
    const response = await request(app).get(PATH);
    expect(mockCollectionGroupDao.getCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed collection group retrieval', async () => {
    sl.set('CollectionGroupDao', {
      getCollections: jest.fn().mockRejectedValue('Retrieve collection group failed'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /collection_groups', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/collection_groups/${groupId}`;
  const mockCollectionGroupDao = {
    addCollections: jest.fn().mockResolvedValue(),
    getCollections: jest.fn().mockResolvedValue(mockGET),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(mockGroup),
  };

  const setup = () => {
    sl.set('CollectionGroupDao', mockCollectionGroupDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).post(PATH).send(mockPOST).set('Cookie', 'jwt=token');

  it('returns 201 on successful addition', async () => {
    const response = await sendRequest();
    expect(mockCollectionGroupDao.addCollections).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('does not allow non-admins to update collection group', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockCollectionGroupDao.addCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to update collection group', async () => {
    const response = await request(app).get(PATH).send(mockPOST);
    expect(mockCollectionGroupDao.addCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed add', async () => {
    sl.set('CollectionGroupDao', {
      ...mockCollectionGroupDao,
      addCollections: jest.fn().mockRejectedValue('failed group add'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 when texts are already blacklisted', async () => {
    const mockExistingPOST = {
      collections: [
        {
          uuid: 'uuid1',
          canRead: true,
          canWrite: false,
        },
        {
          uuid: 'uuid2',
          canRead: false,
          canWrite: false,
        },
      ],
    };
    const response = await request(app).post(PATH).send(mockExistingPOST).set('Cookie', 'jwt=token');
    expect(mockCollectionGroupDao.addCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});

describe('PATCH /collection_groups', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/collection_groups/${groupId}`;
  const mockCollectionGroupDao = {
    containsAssociation: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(mockGroup),
  };

  const setup = () => {
    sl.set('CollectionGroupDao', mockCollectionGroupDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).patch(PATH).send(mockPATCH).set('Cookie', 'jwt=token');

  it('return 204 on successful collections permission change', async () => {
    const response = await sendRequest();
    expect(mockCollectionGroupDao.containsAssociation).toHaveBeenCalled();
    expect(mockCollectionGroupDao.update).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('does not allow non-admins to change group collection permissions', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockCollectionGroupDao.update).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to change group collection permissions', async () => {
    const response = await request(app).patch(PATH).send(mockPATCH);
    expect(mockCollectionGroupDao.update).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed permissions update', async () => {
    sl.set('CollectionGroupDao', {
      ...mockCollectionGroupDao,
      update: jest.fn().mockRejectedValue('failed collection group permission update'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if group collection association does not exist', async () => {
    sl.set('CollectionGroupDao', {
      ...mockCollectionGroupDao,
      containsAssociation: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });
});

describe('DELETE /collection_groups/:groupId/:uuid', () => {
  const groupId = 1;
  const uuid = 'uuid1';
  const PATH = `${API_PATH}/collection_groups/${groupId}/${uuid}`;
  const mockCollectionGroupDao = {
    getCollections: jest.fn().mockResolvedValue(mockGET),
    removeCollections: jest.fn().mockResolvedValue(),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(mockGroup),
  };

  const setup = () => {
    sl.set('CollectionGroupDao', mockCollectionGroupDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).delete(PATH).set('Cookie', 'jwt=token');

  it('returns 204 on successful deletion', async () => {
    const response = await sendRequest();
    expect(mockCollectionGroupDao.removeCollections).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('does not allow non-admins to delete from collection groups', async () => {
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockCollectionGroupDao.removeCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to delete from collection groups', async () => {
    const response = await request(app).delete(PATH);
    expect(mockCollectionGroupDao.removeCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed delete', async () => {
    sl.set('CollectionGroupDao', {
      ...mockCollectionGroupDao,
      removeCollections: jest.fn().mockRejectedValue('failed collection group removal'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 if group does not exist', async () => {
    sl.set('OareGroupDao', {
      getGroupById: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 when texts to be deleted are not in the collection group permissions', async () => {
    const response = await request(app).delete(`${API_PATH}/collection_groups/1/uuid3`).set('Cookie', 'jwt=token');
    expect(mockCollectionGroupDao.removeCollections).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});
