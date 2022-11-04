import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const seal = {
  uuid: 'dd978e96-1066-960b-d083-1cbb233c3764',
  name: 'Seal of Aššur-rabi s. Lā-qēpum',
  imageLinks: ['imageLink'],
  count: 1,
  sealProperties: [
    {
      'Primary Classification': 'Cylinder Seal',
    },
    {
      Style: 'Cappadocian Style',
    },
    {
      Scene: 'Presentation Scene',
    },
    {
      'Teissier Number (CS)': '110',
    },
    {
      CS: '110',
    },
  ],
  sealImpressions: [
    {
      uuid: 'd7c160df-1ef6-4070-bbe2-3d81b4938bb2',
      type: 'logosyllabic',
      language: null,
      cdliNum: 'P359420',
      translitStatus: '5536b5bd-e18e-11ea-8c9d-02b316ca7378',
      name: 'ICK 1 22a Envelope',
      displayName: 'ICK 1 22a',
      excavationPrefix: null,
      excavationNumber: null,
      museumPrefix: 'Ka',
      museumNumber: null,
      publicationPrefix: 'ICK 1',
      publicationNumber: '22a',
      objectType: 'envelope',
      source: null,
      genre: null,
      subgenre: null,
    },
  ],
};

const mockPermissionsDao = {
  getUserPermissions: jest.fn().mockResolvedValue([
    {
      name: 'SEALS',
    },
    { name: 'EDIT_SEAL' },
  ]),
};

const mockUserDao = {
  getUserByUuid: jest.fn().mockResolvedValue({
    uuid: 'user-uuid',
  }),
};

describe('GET /seals/:uuid', () => {
  const PATH = `${API_PATH}/seals/${seal.uuid}`;

  const mockSealDao = {
    getSealByUuid: jest
      .fn()
      .mockResolvedValue({ name: seal.name, uuid: seal.uuid }),
    getSealImpressionsBySealUuid: jest
      .fn()
      .mockResolvedValue(seal.sealImpressions),
    getSealProperties: jest.fn().mockResolvedValue(seal.sealProperties),
    getSealImpressionCountBySealUuid: jest.fn().mockResolvedValue(seal.count),
    getImagesBySealUuid: jest.fn().mockResolvedValue(seal.imageLinks),
  };

  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue(seal.sealImpressions[0]),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('SealDao', mockSealDao);
    sl.set('cache', mockCache);
    sl.set('TextDao', mockTextDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful seals retrieval', async () => {
    const response = await sendRequest();
    expect(mockSealDao.getSealByUuid).toHaveBeenCalled();
    expect(mockSealDao.getSealProperties).toHaveBeenCalled();
    expect(mockSealDao.getImagesBySealUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed seal retrieval', async () => {
    sl.set('SealDao', {
      ...mockSealDao,
      getSealByUuid: jest.fn().mockRejectedValue('failed seal retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 403 when user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });
});

describe('PATCH /seals/:uuid', () => {
  const PATH = `${API_PATH}/seals/${seal.uuid}`;

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const mockSealDao = {
    updateSealSpelling: jest.fn().mockResolvedValue(),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
    clear: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('SealDao', mockSealDao);
    sl.set('cache', mockCache);
    sl.set('utils', mockUtils);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).patch(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful seal update', async () => {
    const response = await sendRequest();
    expect(mockSealDao.updateSealSpelling).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed seal update', async () => {
    sl.set('SealDao', {
      ...mockSealDao,
      updateSealSpelling: jest.fn().mockRejectedValue('failed seal update'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 403 when user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });
});

describe('GET /seals', () => {
  const PATH = `${API_PATH}/seals`;

  const mockSealDao = {
    getSeals: jest
      .fn()
      .mockResolvedValue([{ name: seal.name, uuid: seal.uuid }]),
    getSealImpressionCountBySealUuid: jest.fn().mockResolvedValue(seal.count),
    getImagesBySealUuid: jest.fn().mockResolvedValue(seal.imageLinks),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('SealDao', mockSealDao);
    sl.set('cache', mockCache);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 on successful seals retrieval', async () => {
    const response = await sendRequest();
    expect(mockSealDao.getSeals).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed seal retrieval', async () => {
    sl.set('SealDao', {
      ...mockSealDao,
      getSeals: jest.fn().mockRejectedValue('failed seals retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 403 when user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });
});
