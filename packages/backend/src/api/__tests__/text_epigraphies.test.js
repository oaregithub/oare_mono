import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /text_epigraphies/transliteration', () => {
  const PATH = `${API_PATH}/text_epigraphies/transliteration`;

  const mockTextDao = {
    getTranslitOptions: jest.fn().mockResolvedValue([
      {
        color: 'Green',
        colorMeaning: 'Green color meaning',
      },
    ]),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'EDIT_TRANSLITERATION_STATUS',
      },
    ]),
  };

  const setup = () => {
    sl.set('TextDao', mockTextDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  beforeEach(setup);

  it('returns 200 on successful transliteration options retreival', async () => {
    const response = await sendRequest();
    expect(mockTextDao.getTranslitOptions).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed translit options retreival', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      getTranslitOptions: jest
        .fn()
        .mockRejectedValue('failed to retreive translit options'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).get(PATH);
    expect(mockTextDao.getTranslitOptions).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockTextDao.getTranslitOptions).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('PATCH /text_epigraphies/transliteration', () => {
  const PATH = `${API_PATH}/text_epigraphies/transliteration`;
  const mockPayload = {
    textUuid: 'test-uuid',
    color: 'test-color',
  };

  const mockTextDao = {
    updateTranslitStatus: jest.fn().mockResolvedValue(),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'EDIT_TRANSLITERATION_STATUS',
      },
    ]),
  };

  const setup = () => {
    sl.set('TextDao', mockTextDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };

  const sendRequest = () =>
    request(app).patch(PATH).send(mockPayload).set('Authorization', 'token');

  beforeEach(setup);

  it('returns 204 on successful transliteration status update', async () => {
    const response = await sendRequest();
    expect(mockTextDao.updateTranslitStatus).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed translit status update', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      updateTranslitStatus: jest
        .fn()
        .mockRejectedValue('failed to update translit status'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).get(PATH);
    expect(mockTextDao.updateTranslitStatus).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockTextDao.updateTranslitStatus).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('GET /text_epigraphies/images/:uuid/:cdliNum', () => {
  const uuid = 'test-uuid';
  const cdliNum = 'test-cdli';
  const PATH = `${API_PATH}/text_epigraphies/images/${uuid}/${cdliNum}`;

  const mockResourceDao = {
    getImageLinksByTextUuid: jest
      .fn()
      .mockResolvedValue(['test-cdli-link', 'test-s3-link']),
  };

  const setup = () => {
    sl.set('ResourceDao', mockResourceDao);
  };

  const sendRequest = () => request(app).get(PATH);

  beforeEach(setup);

  it('returns 200 on successful link retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed link retrieval', async () => {
    sl.set('ResourceDao', {
      ...mockResourceDao,
      getImageLinksByTextUuid: jest
        .fn()
        .mockRejectedValue('failed image link retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /text_epigraphies/text/:uuid', () => {
  const textUuid = 12345;
  const PATH = `${API_PATH}/text_epigraphies/text/${textUuid}`;

  const mockResponse = {
    text: {
      uuid: 'testUuid',
      type: 'testType',
      name: 'testName',
      excavationPrefix: 'testExcavationPrefix',
      excavationNumber: 'testExcavationNumber',
      museumPrefix: 'testMuseumPrefix',
      museumNumber: 'testMuseumNumber',
      publicationPrefix: 'testPublicationPrefix',
      publicationNumber: 'testPublicationNumber',
    },
    collection: {
      uuid: '12345',
      name: 'Test Collection',
    },
    units: [
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
        markups: [
          {
            referenceUuid: '12345',
            type: 'isCollatedReading',
            value: null,
            startChar: null,
            endChar: null,
          },
        ],
      },
    ],
    canWrite: false,
    cdliNum: 'TestCdliNum',
    color: 'red',
    colorMeaning: 'Test Color Meaning',

    discourseUnits: [
      {
        uuid: '12345',
        type: 'discourseUnit',
        units: [],
      },
    ],
    hasEpigraphy: true,
    zoteroData: [
      {
        citation: 'test-zotero-citation-2',
        link: 'https://oare-unit-test.com/test-resource-link-abc.pdf',
      },
    ],
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
        markups: [
          {
            referenceUuid: '12345',
            type: 'isCollatedReading',
            value: null,
            startChar: null,
            endChar: null,
          },
        ],
      },
    ]),
    hasEpigraphy: jest.fn().mockResolvedValue(true),
  };

  const mockTextDao = {
    getCdliNum: jest.fn().mockResolvedValue('TestCdliNum'),
    getTranslitStatus: jest.fn().mockResolvedValue({
      color: 'red',
      colorMeaning: 'Test Color Meaning',
    }),
    getTextByUuid: jest.fn().mockResolvedValue({
      uuid: 'testUuid',
      type: 'testType',
      name: 'testName',
      excavationPrefix: 'testExcavationPrefix',
      excavationNumber: 'testExcavationNumber',
      museumPrefix: 'testMuseumPrefix',
      museumNumber: 'testMuseumNumber',
      publicationPrefix: 'testPublicationPrefix',
      publicationNumber: 'testPublicationNumber',
    }),
  };

  const mockTextDiscourseDao = {
    getTextDiscourseUnits: jest.fn().mockResolvedValue([
      {
        uuid: '12345',
        type: 'discourseUnit',
        units: [],
      },
    ]),
  };

  const mockTextDraftsDao = {
    getDraft: jest.fn().mockResolvedValue({
      content: 'my draft',
    }),
  };

  const mockCollectionDao = {
    getTextCollection: jest.fn().mockResolvedValue(mockResponse.collection),
  };

  const mockItemPropertiesDao = {
    addProperty: jest.fn().mockResolvedValue(),
    getVariableObjectByReference: jest
      .fn()
      .mockResolvedValue(['test-variable-object-uuid']),
  };

  const mockCollectionTextUtils = {
    canViewText: jest.fn().mockResolvedValue(true),
    canEditText: jest.fn().mockResolvedValue(false),
  };

  const mockResourceDao = {
    getFileURLByUuid: jest
      .fn()
      .mockResolvedValue([
        'https://oare-unit-test.com/test-resource-link-abc.pdf',
      ]),
  };

  const mockBibliographyDao = {
    getZoteroCitationsByUuid: jest
      .fn()
      .mockResolvedValue(['test-zotero-citation-2']),
  };

  const setup = () => {
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('TextDao', mockTextDao);
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('TextDraftsDao', mockTextDraftsDao);
    sl.set('CollectionDao', mockCollectionDao);
    sl.set('CollectionTextUtils', mockCollectionTextUtils);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('BibliographyDao', mockBibliographyDao);
  };

  const sendRequest = () => request(app).get(PATH);

  beforeEach(setup);

  it('returns 200 on successful data retrieval', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockResponse);
  });

  it('returns 400 if text does not exist', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      getTextByUuid: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 400 if text does not exist', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      getTextByUuid: jest.fn().mockResolvedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('does not allow denylisted texts to be seen', async () => {
    sl.set('CollectionTextUtils', {
      ...mockCollectionTextUtils,
      canViewText: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
    expect(mockTextEpigraphyDao.getEpigraphicUnits).not.toHaveBeenCalled();
    expect(mockTextDao.getCdliNum).not.toHaveBeenCalled();
    expect(mockTextDao.getTranslitStatus).not.toHaveBeenCalled();
    expect(mockTextDiscourseDao.getTextDiscourseUnits).not.toHaveBeenCalled();
  });

  it('returns 500 when failing to check if text is viewable', async () => {
    sl.set('CollectionTextUtils', {
      ...mockCollectionTextUtils,
      canViewText: jest
        .fn()
        .mockRejectedValue('failed to check if text is viewable'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed text retrieval', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      getTextByUuid: jest.fn().mockRejectedValue('Failed to get text'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed epigraphic units retrieval', async () => {
    sl.set('TextEpigraphyDao', {
      getEpigraphicUnits: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed collections retrieval', async () => {
    sl.set('CollectionDao', {
      getTextCollection: jest
        .fn()
        .mockRejectedValue('could not retrieve collection'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed cdliNum retrieval', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      getCdliNum: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed translit status retrieval', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      getTranslitStatus: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed discourse units retrieval', async () => {
    sl.set('TextDiscourseDao', {
      getTextDiscourseUnits: jest.fn().mockRejectedValue(null),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed write permission check', async () => {
    sl.set('CollectionTextUtils', {
      ...mockCollectionTextUtils,
      canEditText: jest.fn().mockRejectedValue(null),
    });
    const response = await request(app).get(PATH).set('Authorization', 'token');
    expect(response.status).toBe(500);
  });

  it('returns 500 when failing to retrieve from text drafts dao', async () => {
    sl.set('TextDraftsDao', {
      ...mockTextDraftsDao,
      getDraft: jest.fn().mockRejectedValue("Couldn't get draft"),
    });

    const response = await request(app).get(PATH).set('Authorization', 'token');
    expect(response.status).toBe(500);
  });
});

describe('GET /text_epigraphies/designator/:preText', () => {
  const mockPreText = 'test-pretext-';
  const PATH = `${API_PATH}/text_epigraphies/designator/${mockPreText}`;

  const mockResourceDao = {
    getImageDesignatorMatches: jest
      .fn()
      .mockResolvedValue(['test-pretext-1.jpg', 'test-pretext-2.jpg']),
  };

  const setup = () => {
    sl.set('ResourceDao', mockResourceDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful designator generation', async () => {
    const response = await sendRequest();
    expect(mockResourceDao.getImageDesignatorMatches).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.text).toBe('3');
  });

  it('returns 500 on failed designator generation', async () => {
    sl.set('ResourceDao', {
      ...mockResourceDao,
      getImageDesignatorMatches: jest
        .fn()
        .mockRejectedValue('failed to generate designator'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /text_epigraphies/create', () => {
  const PATH = `${API_PATH}/text_epigraphies/create`;
  const mockPayload = {
    tables: {
      epigraphies: [
        {
          uuid: 'test-epigraphy-uuid',
        },
      ],
      markups: [
        {
          uuid: 'test-markup-uuid',
        },
      ],
      discourses: [
        {
          uuid: 'test-discourse-uuid',
        },
      ],
      text: {
        uuid: 'test-uuid',
        name: 'test-name',
      },
      itemProperties: [
        {
          uuid: 'test-property-uuid',
        },
      ],
      signInfo: [],
      resources: [
        {
          uuid: 'test-resource-uuid',
        },
      ],
      links: [
        {
          uuid: 'test-link-uuid',
        },
      ],
      hierarchy: {
        uuid: 'test-hierarchy-uuid',
      },
      trees: [
        {
          uuid: 'test-tree-uuid',
          type: 'test-type',
        },
      ],
    },
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_NEW_TEXTS',
      },
    ]),
  };

  const mockTextDao = {
    insertTextRow: jest.fn().mockResolvedValue(),
    getTextRowByUuid: jest.fn().mockResolvedValue(false),
  };

  const mockHierarchyDao = {
    insertHierarchyRow: jest.fn().mockResolvedValue(),
  };

  const mockItemPropertiesDao = {
    addProperty: jest.fn().mockResolvedValue(),
    getVariableObjectByReference: jest
      .fn()
      .mockResolvedValue(['test-variable-object-uuid']),
  };

  const mockResourceDao = {
    insertResourceRow: jest.fn().mockResolvedValue(),
    insertLinkRow: jest.fn().mockResolvedValue(),
  };

  const mockTextDiscourseDao = {
    insertDiscourseRow: jest.fn().mockResolvedValue(),
  };

  const mockTextEpigraphyDao = {
    insertEpigraphyRow: jest.fn().mockResolvedValue(),
  };

  const mockTextMarkupDao = {
    insertMarkupRow: jest.fn().mockResolvedValue(),
  };

  const mockPublicDenylistDao = {
    addItemsToDenylist: jest.fn().mockResolvedValue(),
  };

  const mockTreeDao = {
    insertTreeRow: jest.fn().mockResolvedValue(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const setup = () => {
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('TextDao', mockTextDao);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('TextMarkupDao', mockTextMarkupDao);
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('TreeDao', mockTreeDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPayload).set('Authorization', 'token');

  it('returns 201 on successful text creation', async () => {
    const response = await sendRequest();
    expect(mockTextDao.insertTextRow).toHaveBeenCalledWith(
      mockPayload.tables.text,
      undefined
    );
    expect(mockHierarchyDao.insertHierarchyRow).toHaveBeenCalledWith(
      mockPayload.tables.hierarchy,
      undefined
    );
    expect(mockItemPropertiesDao.addProperty).toHaveBeenCalledWith(
      mockPayload.tables.itemProperties[0],
      undefined
    );
    expect(mockResourceDao.insertResourceRow).toHaveBeenCalledWith(
      mockPayload.tables.resources[0],
      undefined
    );
    expect(mockResourceDao.insertLinkRow).toHaveBeenCalledWith(
      mockPayload.tables.links[0],
      undefined
    );
    expect(mockTreeDao.insertTreeRow).toHaveBeenCalledWith(
      mockPayload.tables.trees[0],
      undefined
    );
    expect(mockTextDiscourseDao.insertDiscourseRow).toHaveBeenCalledWith(
      mockPayload.tables.discourses[0],
      undefined
    );
    expect(mockTextEpigraphyDao.insertEpigraphyRow).toHaveBeenCalledWith(
      mockPayload.tables.epigraphies[0],
      undefined
    );
    expect(mockTextMarkupDao.insertMarkupRow).toHaveBeenCalledWith(
      mockPayload.tables.markups[0],
      undefined
    );
    expect(mockPublicDenylistDao.addItemsToDenylist).toHaveBeenCalledWith(
      [mockPayload.tables.text.uuid],
      'text',
      undefined
    );
    expect(response.status).toBe(201);
  });

  it('returns 500 if dao function fails', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      insertTextRow: jest.fn().mockRejectedValue('failed to insert text row'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).post(PATH).send(mockPayload);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission to add texts', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });
});

describe('PATCH /text_epigraphies/edit_text_info', () => {
  const PATH = `${API_PATH}/text_epigraphies/edit_text_info`;

  const mockRequestBody = {
    uuid: '12345',
    excavationPrefix: 'a',
    excavationNumber: 'b',
    museumPrefix: 'c',
    museumNumber: 'd',
    publicationPrefix: 'e',
    publicationNumber: 'f',
  };

  const mockTextDao = {
    updateTextInfo: jest.fn().mockResolvedValue(),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'EDIT_TEXT_INFO',
      },
    ]),
  };

  const setup = () => {
    sl.set('TextDao', mockTextDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app)
      .patch(PATH)
      .send(mockRequestBody)
      .set('Authorization', 'token');

  it('returns 201 on successful text info edit', async () => {
    const response = await sendRequest();
    expect(mockTextDao.updateTextInfo).toHaveBeenCalledWith(
      '12345',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f'
    );
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed text info edit', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      updateTextInfo: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).patch(PATH).send(mockRequestBody);
    expect(mockTextDao.updateTextInfo).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockTextDao.updateTextInfo).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
