import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

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
    archiveExists: jest.fn().mockResolvedValue(true),
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

  it('returns 400 if archive does not exist', async () => {
    sl.set('ArchiveDao', {
      ...mockArchiveDao,
      archiveExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
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
    archiveExists: jest.fn().mockResolvedValue(true),
    getDossierByUuid: jest.fn().mockResolvedValue({}),
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

  it('returns 400 if dossier does not exist', async () => {
    sl.set('ArchiveDao', {
      ...mockArchiveDao,
      archiveExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 500 on failed dossier retrieval', async () => {
    sl.set('ArchiveDao', {
      getDossierByUuid: jest.fn().mockRejectedValue('failed dossier retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /archive/:uuid', () => {
  const archiveUuid = 'mockUuid';
  const textUuid = 'mockTextUuid';
  const PATH = `${API_PATH}/archive/${archiveUuid}?textUuid=${textUuid}`;

  const AdminUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockArchiveDao = {
    archiveExists: jest.fn().mockResolvedValue(true),
    disconnectText: jest.fn().mockResolvedValue(),
  };

  const mockTextDao = {
    textExists: jest.fn().mockResolvedValue(true),
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
    sl.set('TextDao', mockTextDao);
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
