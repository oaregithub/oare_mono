import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockQuarantineTextDao = {
  textIsQuarantined: jest.fn().mockResolvedValue(false),
  quarantineText: jest.fn().mockResolvedValue(),
  removeQuarantineTextRow: jest.fn().mockResolvedValue(),
  getQuarantinedTextRows: jest
    .fn()
    .mockResolvedValue([{ uuid: 'test-uuid', timestamp: 'test-timestamp' }]),
};

const mockTextDao = {
  getTextByUuid: jest.fn().mockResolvedValue({ uuid: 'text-uuid' }),
  removeTextByUuid: jest.fn().mockResolvedValue(),
};

const mockTextEpigraphyDao = {
  hasEpigraphy: jest.fn().mockResolvedValue(true),
  removeEpigraphyRowsByTextUuid: jest.fn().mockResolvedValue(),
};

const mockUtils = {
  createTransaction: jest.fn(async cb => {
    await cb();
  }),
};

const mockPublicDenylistDao = {
  removeItemFromDenylist: jest.fn().mockResolvedValue(),
};

const mockGroupAllowlistDao = {
  removeItemFromAllAllowlists: jest.fn().mockResolvedValue(),
};

const mockGroupEditPermissionsDao = {
  removeItemFromAllEditPermissions: jest.fn().mockResolvedValue(),
};

const mockItemPropertiesDao = {
  deletePropertiesByReferenceUuid: jest.fn().mockResolvedValue(),
};

const mockTextDiscourseDao = {
  removeDiscourseRowsByTextUuid: jest.fn().mockResolvedValue(),
};

const mockResourceDao = {
  removeLinkRowByReferenceUuid: jest.fn().mockResolvedValue(),
};

const mockHierarchyDao = {
  removeHierarchyTextRowsByTextUuid: jest.fn().mockResolvedValue(),
};

const mockNoteDao = {
  removeNotesByReferenceUuid: jest.fn().mockResolvedValue(),
};

const mockAliasDao = {
  removeAliasByReferenceUuid: jest.fn().mockResolvedValue(),
};

const mockFieldDao = {
  removeFieldRowsByReferenceUuid: jest.fn().mockResolvedValue(),
};

const mockTextDraftsDao = {
  removeDraftsByTextUuid: jest.fn().mockResolvedValue(),
};

const mockUserDao = {
  getUserByUuid: jest.fn().mockResolvedValue({
    isAdmin: true,
  }),
};

describe('POST /quarantine/:textUuid', () => {
  const textUuid = 'test-uuid';
  const PATH = `${API_PATH}/quarantine/${textUuid}`;

  const setup = () => {
    sl.set('QuarantineTextDao', mockQuarantineTextDao);
    sl.set('TextDao', mockTextDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).set('Authorization', 'token');

  it('returns 201 on successful quarantining', async () => {
    const response = await sendRequest();
    expect(mockQuarantineTextDao.textIsQuarantined).toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).toHaveBeenCalled();
    expect(mockQuarantineTextDao.quarantineText).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed quarantine', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      quarantineText: jest.fn().mockRejectedValue('failed to quarantine text'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged in users to quarantine texts', async () => {
    const response = await request(app).post(PATH);
    expect(mockQuarantineTextDao.quarantineText).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to quarantine texts', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockQuarantineTextDao.quarantineText).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 400 if text is already quarantined', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      textIsQuarantined: jest.fn().mockResolvedValue(true),
    });
    const response = await sendRequest();
    expect(mockQuarantineTextDao.quarantineText).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it('returns 400 if text does not exist', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      getTextByUuid: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(mockQuarantineTextDao.quarantineText).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});

describe('DELETE /quarantine/:textUuid', () => {
  const textUuid = 'test-uuid';
  const PATH = `${API_PATH}/quarantine/${textUuid}`;

  const setup = () => {
    sl.set('QuarantineTextDao', mockQuarantineTextDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful restore', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      textIsQuarantined: jest.fn().mockResolvedValue(true),
    });
    const response = await sendRequest();
    expect(mockQuarantineTextDao.removeQuarantineTextRow).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed restoration', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      textIsQuarantined: jest.fn().mockResolvedValue(true),
      removeQuarantineTextRow: jest
        .fn()
        .mockRejectedValue('failed to restore text'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged in users to restore texts', async () => {
    const response = await request(app).delete(PATH);
    expect(
      mockQuarantineTextDao.removeQuarantineTextRow
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to restore texts', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(
      mockQuarantineTextDao.removeQuarantineTextRow
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 400 if text is not already quarantined', async () => {
    const response = await sendRequest();
    expect(
      mockQuarantineTextDao.removeQuarantineTextRow
    ).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});

describe('GET /quarantine', () => {
  const PATH = `${API_PATH}/quarantine`;

  const setup = () => {
    sl.set('QuarantineTextDao', mockQuarantineTextDao);
    sl.set('TextDao', mockTextDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful quarantine list retrieval', async () => {
    const response = await sendRequest();
    expect(mockQuarantineTextDao.getQuarantinedTextRows).toHaveBeenCalled();
    expect(mockTextEpigraphyDao.hasEpigraphy).toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed retrieval', async () => {
    sl.set('QuarantineTextDao', {
      ...mockQuarantineTextDao,
      getQuarantinedTextRows: jest
        .fn()
        .mockRejectedValue('failed to retrieve quarantine list'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged in users to get quarantine list', async () => {
    const response = await request(app).get(PATH);
    expect(mockQuarantineTextDao.getQuarantinedTextRows).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to get quarantine list', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockQuarantineTextDao.getQuarantinedTextRows).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('DELETE /quarantine/permanent_delete/:textUuid', () => {
  const textUuid = 'test-uuid';
  const PATH = `${API_PATH}/quarantine/permanent_delete/${textUuid}`;

  const setup = () => {
    sl.set('utils', mockUtils);
    sl.set('QuarantineTextDao', mockQuarantineTextDao);
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('GroupAllowlistDao', mockGroupAllowlistDao);
    sl.set('GroupEditPermissionsDao', mockGroupEditPermissionsDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('TextDao', mockTextDao);
    sl.set('NoteDao', mockNoteDao);
    sl.set('AliasDao', mockAliasDao);
    sl.set('FieldDao', mockFieldDao);
    sl.set('TextDraftsDao', mockTextDraftsDao);
    sl.set('UserDao', mockUserDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful permanent deletion', async () => {
    const response = await sendRequest();
    expect(mockUtils.createTransaction).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed deletion', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      removeTextByUuid: jest
        .fn()
        .mockRejectedValue('failed to delete text row'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged-in users to delete texts', async () => {
    const response = await request(app).delete(PATH);
    expect(mockUtils.createTransaction).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow non-admins to delete texts', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockUtils.createTransaction).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
