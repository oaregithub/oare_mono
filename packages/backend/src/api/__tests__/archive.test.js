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
  const archiveUuid = 'mockUuid';
  const textToHideUuid = 'textToHideUuid';
  const archiveInfo = {
    name: 'mockArchive',
    uuid: archiveUuid,
    totalTexts: 1,
    totalDossiers: 1,
  };

  const mockCollectionTextUtils = {
    textsToHide: jest.fn().mockResolvedValue([textToHideUuid]),
  };

  const mockArchiveDao = {
    getAllArchives: jest.fn().mockResolvedValue([archiveUuid]),
    getArchiveInfo: jest.fn().mockResolvedValue(archiveInfo),
    getArchiveByUuid: jest.fn().mockResolvedValue(archive),
  };

  const setup = () => {
    sl.set('ArchiveDao', mockArchiveDao);
    sl.set('CollectionTextUtils', mockCollectionTextUtils);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        uuid: 'test-user-uuid',
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful archives retrieval', async () => {
    const response = await sendRequest();
    expect(mockArchiveDao.getAllArchives).toHaveBeenCalled();
    expect(mockArchiveDao.getArchiveInfo).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed archives retrieval', async () => {
    sl.set('ArchiveDao', {
      ...mockArchiveDao,
      getArchiveInfo: jest
        .fn()
        .mockRejectedValue('failed on archives retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /archives/:uuid', () => {
  const uuid = 'mockUuid';
  const PATH = `${API_PATH}/archives/${uuid}`;

  const mockArchiveDao = {
    getArchiveByUuid: jest.fn().mockResolvedValue(archive),
  };

  const mockUtils = {
    extractPagination: jest
      .fn()
      .mockReturnValue({ filter: '', limit: 10, page: 1 }),
  };

  const setup = () => {
    sl.set('ArchiveDao', mockArchiveDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful archive text retrieval', async () => {
    const response = await sendRequest();
    expect(mockArchiveDao.getArchiveByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed archive texts retrieval', async () => {
    sl.set('ArchiveDao', {
      getArchiveByUuid: jest
        .fn()
        .mockRejectedValue('failed archive texts retrieval'),
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

  const mockUtils = {
    extractPagination: jest
      .fn()
      .mockReturnValue({ filter: '', limit: 10, page: 1 }),
  };

  const setup = () => {
    sl.set('ArchiveDao', mockArchiveDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful archive text retrieval', async () => {
    const response = await sendRequest();
    expect(mockArchiveDao.getDossierByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed archive texts retrieval', async () => {
    sl.set('ArchiveDao', {
      getDossierByUuid: jest
        .fn()
        .mockRejectedValue('failed archive texts retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
