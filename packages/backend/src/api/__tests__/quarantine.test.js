import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('POST /quarantine/:textUuid', () => {
  const textUuid = 'test-text-uuid';
  const PATH = `${API_PATH}/quarantine/${textUuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockQuarantineTextDao = {
    textIsQuarantined: jest.fn().mockResolvedValue(false),
    quarantineText: jest.fn().mockResolvedValue(),
  };

  const mockTextDao = {
    textExists: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('QuarantineTextDao', mockQuarantineTextDao);
    sl.set('TextDao', mockTextDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).post(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 upon successful text quarantine', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(201);
  });

  it('returns 400 if text is already quarantined', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      textIsQuarantined: jest.fn().mockResolvedValue(true),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if text does not exist', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      textExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if text quarantine fails', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      quarantineText: jest.fn().mockRejectedValue('Failed to quarantine text'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('DELETE /quarantine/:textUuid', () => {
  const textUuid = 'test-text-uuid';
  const PATH = `${API_PATH}/quarantine/${textUuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockQuarantineTextDao = {
    textIsQuarantined: jest.fn().mockResolvedValue(true),
    removeQuarantineTextRow: jest.fn().mockResolvedValue(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('QuarantineTextDao', mockQuarantineTextDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).delete(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 204 upon successful text quarantine removal', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(204);
  });

  it('returns 400 if text is not quarantined', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      textIsQuarantined: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if text quarantine removal fails', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      removeQuarantineTextRow: jest
        .fn()
        .mockRejectedValue('Failed to remove quarantine text row'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /quarantine', () => {
  const PATH = `${API_PATH}/quarantine`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockQuarantineTextDao = {
    getAllQuarantinedTextUuids: jest.fn().mockResolvedValue([]),
    getQuarantineTextRowByReferenceUuid: jest.fn().mockResolvedValue({}),
  };

  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue({}),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('QuarantineTextDao', mockQuarantineTextDao);
    sl.set('TextDao', mockTextDao);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).get(PATH);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 200 upon successful quarantine list retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user is not admin', async () => {
    sl.set('UserDao', {
      ...mockUserDao,
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if quarantine list retrieval fails', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      getAllQuarantinedTextUuids: jest
        .fn()
        .mockRejectedValue('Failed to retrieve quarantine list'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
