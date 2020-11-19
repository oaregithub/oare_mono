import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /text_epigraphies/:uuid', () => {
  const textUuid = 12345;
  const PATH = `${API_PATH}/text_epigraphies/${textUuid}`;

  const mockJSON = {
    textName: 'Test Alias',
    collection: {
      uuid: '12345',
      name: 'Test Collection',
    },
    units: [{
      uuid: '12345',
      side: 'obv.',
      column: 1,
      line: 1,
      charOnLine: 1,
      charOnTablet: 1,
      discourseUuid: '12345',
      reading: 'Test Reading',
      type: null,
      value: null,
    }],
    canWrite: false,
    cdliNum: 'TestCdliNum',
    color: 'red',
    colorMeaning: 'Test Color Meaning',
    markups: [{
      referenceUuid: '12345',
      type: '.isCollatedReading',
      value: null,
      startChar: null,
      endChar: null,
    }],
  };

  const mockAliasDao = {
    displayAliasNames: jest.fn().mockResolvedValue('Test Alias'),
  };

  const mockTextEpigraphyDao = {
    getEpigraphicUnits: jest.fn().mockResolvedValue([
      {
        uuid: '12345',
        side: 'obv.',
        column: 1,
        line: 1,
        charOnLine: 1,
        charOnTablet: 1,
        discourseUuid: '12345',
        reading: 'Test Reading',
        type: null,
        value: null,
      },
    ]),
  };

  const mockTextGroupDao = {
    userHasWritePermission: jest.fn().mockResolvedValue(false),
    getUserBlacklist: jest.fn().mockResolvedValue(['67890']),
  };

  const mockHierarchyDao = {
    getEpigraphyCollection: jest.fn().mockResolvedValue(
      {
        uuid: '12345',
        name: 'Test Collection',
      },
    ),
  };

  const mockTextDao = {
    getCdliNum: jest.fn().mockResolvedValue('TestCdliNum'),
    getTranslitStatus: jest.fn().mockResolvedValue(
      {
        color: 'red',
        colorMeaning: 'Test Color Meaning',
      },
    ),
  };

  const mockTextMarkupDao = {
    getMarkups: jest.fn().mockResolvedValue([
      {
        referenceUuid: '12345',
        type: '.isCollatedReading',
        value: null,
        startChar: null,
        endChar: null,
      },
    ]),
  };

  const setup = () => {
    sl.set('AliasDao', mockAliasDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('TextGroupDao', mockTextGroupDao);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('TextDao', mockTextDao);
    sl.set('TextMarkupDao', mockTextMarkupDao);
  };

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful data retrieval', async () => {
    setup();
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockJSON);
  })

  it('does not allow blacklisted texts to be seen', async () => {
    setup();
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      getUserBlacklist: jest.fn().mockResolvedValue(['12345']),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('allows admins to see blacklisted texts', async () => {
    setup();
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      getUserBlacklist: jest.fn().mockResolvedValue(['12345']),
    });
    const response = await request(app).get(PATH).set('Cookie', 'jwt=token');
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed blacklist check', async () => {
    setup();
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      getUserBlacklist: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed alias name retrieval', async () => {
    setup();
    sl.set('AliasDao', {
      displayAliasNames: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed epigraphic units retrieval', async () => {
    setup();
    sl.set('TextEpigraphyDao', {
      getEpigraphicUnits: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed collections retrieval', async () => {
    setup();
    sl.set('HierarchyDao', {
      getEpigraphyCollection: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed cdliNum retrieval', async () => {
    setup();
    sl.set('TextDao', {
      ...mockTextDao,
      getCdliNum: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed translit status retrieval', async () => {
    setup();
    sl.set('TextDao', {
      ...mockTextDao,
      getTranslitStatus: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed markups retrieval', async () => {
    setup();
    sl.set('TextMarkupDao', {
      getMarkups: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed write permission check', async () => {
    setup();
    sl.set('UserDao', {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    });
    sl.set('TextGroupDao', {
      ...mockTextGroupDao,
      userHasWritePermission: jest.fn().mockRejectedValue(null),
    });
    const response = await request(app).get(PATH).set('Cookie', 'jwt=token');
    expect(response.status).toBe(500);
  });
});
