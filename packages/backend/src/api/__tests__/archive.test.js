import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockDossierInfo = {
  name: 'mockDossier',
  uuid: '12345',
  totalTexts: 20,
};

const archive = {
  uuid: 'mockUuid',
  name: 'mockArchive',
  parent_uuid: '4d5e6f',
  owner: 'owner',
  arch_locus: 'arch_locus',
  dossiersInfo: [mockDossierInfo],
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
  totalTexts: 2,
  totalDossiers: 1,
  bibliographyUuid: 'bibUuid',
  descriptions: [],
};

const dossier = {
  uuid: 'mockUuid',
  name: 'mockDossier',
  parent_uuid: '4d5e6f7g',
  owner: 'owner',
  arch_locus: 'arch_locus',
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
  totalTexts: 2,
  totalDossiers: 1,
};

describe('GET /archives', () => {
  const PATH = `${API_PATH}/archives`;

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const mockArchiveDao = {
    getAllArchiveUuids: jest.fn().mockResolvedValue(['test-uuid']),
    getArchiveByUuid: jest.fn().mockResolvedValue({}),
  };

  const setup = () => {
    sl.set('ArchiveDao', mockArchiveDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful archives retrieval', async () => {
    const response = await sendRequest();
    expect(mockArchiveDao.getAllArchiveUuids).toHaveBeenCalled();
    expect(mockArchiveDao.getArchiveByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed archives retrieval', async () => {
    sl.set('ArchiveDao', {
      ...mockArchiveDao,
      getAllArchiveUuids: jest
        .fn()
        .mockRejectedValue('failed on archives retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /archive/:uuid', () => {
  const uuid = 'mockUuid';
  const PATH = `${API_PATH}/archive/${uuid}`;

  const mockArchiveDao = {
    getArchiveByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('ArchiveDao', mockArchiveDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful archive retrieval', async () => {
    const response = await sendRequest();
    expect(mockArchiveDao.getArchiveByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed archive retrieval', async () => {
    sl.set('ArchiveDao', {
      getArchiveByUuid: jest.fn().mockRejectedValue('failed archive retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /dossier/:uuid', () => {
  const uuid = 'mockUuid';
  const PATH = `${API_PATH}/dossier/${uuid}`;

  const mockArchiveDao = {
    getDossierByUuid: jest.fn().mockResolvedValue(dossier),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('ArchiveDao', mockArchiveDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful dossier retrieval', async () => {
    const response = await sendRequest();
    expect(mockArchiveDao.getDossierByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed dossier retrieval', async () => {
    sl.set('ArchiveDao', {
      getDossierByUuid: jest.fn().mockRejectedValue('failed dossier retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /archive/:archiveUuid/disconnect_text/:textUuid', () => {
  const archiveUuid = 'mockUuid';
  const textUuid = 'mockTextUuid';
  const PATH = `${API_PATH}/archive/${archiveUuid}/disconnect_text/${textUuid}`;

  const AdminUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockArchiveDao = {
    disconnectText: jest.fn().mockResolvedValue(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('UserDao', AdminUserDao);
    sl.set('ArchiveDao', mockArchiveDao);
    sl.set('utils', mockUtils);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful disconnection', async () => {
    const response = await sendRequest();
    expect(mockArchiveDao.disconnectText).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed disconnection', async () => {
    sl.set('ArchiveDao', {
      disconnectText: jest
        .fn()
        .mockRejectedValue('failed archive texts disconnect'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 403 when user is not admin', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });
});
