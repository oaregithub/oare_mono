import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const mockGET = [
  {
    name: 'text1',
    uuid: 'uuid1',
    canRead: true,
    canWrite: true,
    hasEpigraphy: true,
  },
  {
    name: 'text2',
    uuid: 'uuid2',
    canRead: true,
    canWrite: true,
    hasEpigraphy: true,
  },
];

const mockPOST = {
  items: [
    {
      uuid: 'uuid1',
      canRead: true,
      canWrite: true,
    },
    {
      uuid: 'uuid2',
      canRead: true,
      canWrite: true,
    },
  ],
};

const mockPATCH = {
  uuid: 'uuid1',
  canRead: true,
  canWrite: true,
};

const mockGroup = {
  id: '1',
  name: 'mockGroup',
  created_on: Date.now(),
  num_users: 1,
};

const mockText = {
  name: 'mockText',
  uuid: 'uuid1',
  canRead: false,
  canWrite: false,
};

describe('GET /text_groups/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/text_groups/${groupId}`;
  const mockTextGroupDao = {
    getTexts: jest.fn().mockResolvedValue(mockGET),
  };
  const mockTextEpigraphyDao = {
    hasEpigraphy: jest.fn().mockResolvedValue(true),
  };

  const setup = () => {
    sl.set('TextGroupDao', mockTextGroupDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful text group retrieval', async () => {
    const response = await sendRequest();
    expect(mockTextGroupDao.getTexts).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockGET);
  });

  it('returns 500 on failed text group retrieval', async () => {
    sl.set('TextGroupDao', {
      getTexts: jest.fn().mockRejectedValue('failed text group retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed epigraphy status retrieval', async () => {
    sl.set('TextEpigraphyDao', {
      hasEpigraphy: jest
        .fn()
        .mockRejectedValue('failed epigraphy status check'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-admin users to get text groups', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockTextGroupDao.getTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to get text groups', async () => {
    const response = await request(app).get(PATH);
    expect(mockTextGroupDao.getTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});

describe('POST /text_groups/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/text_groups/${groupId}`;
  const mockTextGroupDao = {
    addTexts: jest.fn().mockResolvedValue(),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(mockGroup),
  };
  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue(mockText),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('TextGroupDao', mockTextGroupDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('TextDao', mockTextDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPOST).set('Authorization', 'token');

  it('returns 201 on successful addition', async () => {
    const response = await sendRequest();
    expect(mockTextGroupDao.addTexts).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('does not allow non-admins to add texts to groups', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockTextGroupDao.addTexts).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to add texts to groups', async () => {
    const response = await request(app).post(PATH).send(mockPOST);
    expect(mockOareGroupDao.getGroupById).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed addition', async () => {
    sl.set('TextGroupDao', {
      addTexts: jest.fn().mockRejectedValue('failed text group addition'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /text_groups/:groupId', () => {
  const groupId = 1;
  const PATH = `${API_PATH}/text_groups/${groupId}`;
  const mockTextGroupDao = {
    containsAssociation: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(mockGroup),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('TextGroupDao', mockTextGroupDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).send(mockPATCH).set('Authorization', 'token');

  it('returns 204 on successful texts permission change', async () => {
    const response = await sendRequest();
    expect(mockTextGroupDao.containsAssociation).toHaveBeenCalled();
    expect(mockTextGroupDao.update).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('does not allow non-admins to update text group permissions', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockTextGroupDao.containsAssociation).not.toHaveBeenCalled();
    expect(mockTextGroupDao.update).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to change text group permissions', async () => {
    const response = await request(app).patch(PATH).send(mockPATCH);
    expect(mockTextGroupDao.containsAssociation).not.toHaveBeenCalled();
    expect(mockTextGroupDao.update).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed permissions update', async () => {
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      update: jest.fn().mockRejectedValue('failed update'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 if table does not contain association', async () => {
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      containsAssociation: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(mockTextGroupDao.update).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});

describe('DELETE /text_groups/:groupId/:textUuid', () => {
  const groupId = 1;
  const textUuid = 'uuid1';
  const PATH = `${API_PATH}/text_groups/${groupId}/${textUuid}`;
  const mockTextGroupDao = {
    containsAssociation: jest.fn().mockResolvedValue(true),
    removeText: jest.fn().mockResolvedValue(),
  };
  const mockOareGroupDao = {
    getGroupById: jest.fn().mockResolvedValue(mockGroup),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('TextGroupDao', mockTextGroupDao);
    sl.set('OareGroupDao', mockOareGroupDao);
    sl.set('cache', mockCache);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).delete(PATH).set('Authorization', 'token');

  it('returns 204 on successful deletion', async () => {
    const response = await sendRequest();
    expect(mockTextGroupDao.containsAssociation).toHaveBeenCalled();
    expect(mockTextGroupDao.removeText).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('does not allow non-admins to delete from text groups', async () => {
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    const response = await sendRequest();
    expect(mockTextGroupDao.removeText).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('does not allow non-logged-in users to delete from text groups', async () => {
    const response = await request(app).delete(PATH);
    expect(mockTextGroupDao.removeText).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 500 on failed delete', async () => {
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      removeText: jest.fn().mockRejectedValue('failed deletion'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 400 when table does not contain association', async () => {
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      containsAssociation: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(mockTextGroupDao.removeText).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});
