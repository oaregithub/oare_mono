import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /text_discourse/properties/:uuid', () => {
  const mockDiscourseUuid = 'mock-discoures-uuid';
  const PATH = `${API_PATH}/text_discourse/properties/${mockDiscourseUuid}`;

  const mockItemProperty = {
    uuid: 'test-uuid',
    referenceUuid: 'test-reference-uuid',
    parentUuid: null,
    level: 1,
    variableUuid: 'test-var-uuid',
    variableName: 'test-var-name',
    valueUuid: 'test-val-uuid',
    valueName: 'test-val-name',
    objectUuid: 'test-obj-uuid',
    value: 'test-val',
  };
  const mockItemPropertiesDao = {
    getPropertiesByReferenceUuid: jest
      .fn()
      .mockResolvedValue([mockItemProperty]),
  };

  const mockNoteDao = {
    getNotesByReferenceUuid: jest.fn().mockResolvedValue([]),
  };

  const setup = () => {
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('NoteDao', mockNoteDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful properties retrieval', async () => {
    const response = await sendRequest();
    expect(
      mockItemPropertiesDao.getPropertiesByReferenceUuid
    ).toHaveBeenCalled();
    expect(mockNoteDao.getNotesByReferenceUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual({
      properties: [
        {
          ...mockItemProperty,
          children: [],
        },
      ],
      notes: [],
    });
  });

  it('returns 500 on failed item properties retrieval', async () => {
    sl.set('ItemPropertiesDao', {
      getPropertiesByReferenceUuid: jest
        .fn()
        .mockRejectedValue('failed to retrieve item properties'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed notes retrieval', async () => {
    sl.set('NoteDao', {
      getNotesByReferenceUuid: jest
        .fn()
        .mockRejectedValue('failed to retrieve notes'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /text_discourse/spelling/:uuid', () => {
  const discourseUuid = 'mock-discoures-uuid';
  const PATH = `${API_PATH}/text_discourse/spelling/${discourseUuid}`;
  const spelling = 'spelling';
  const TextDiscourseDao = {
    getSpellingByDiscourseUuid: jest.fn().mockResolvedValue(spelling),
  };

  const setup = () => {
    sl.set('TextDiscourseDao', TextDiscourseDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful spelling retrieval', async () => {
    const response = await sendRequest();
    expect(TextDiscourseDao.getSpellingByDiscourseUuid).toHaveBeenCalledWith(
      discourseUuid
    );
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed item properties retrieval', async () => {
    sl.set('TextDiscourseDao', {
      getSpellingByDiscourseUuid: jest
        .fn()
        .mockRejectedValue('failed to retrieve discourse spelling'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('POST /text_discourse', () => {
  const PATH = `${API_PATH}/text_discourse`;

  const mockTextDiscourseDao = {
    insertNewDiscourseRow: jest.fn().mockResolvedValue(),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'INSERT_DISCOURSE_ROWS' }]),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const mockPayload = {
    spelling: 'a-na',
    occurrences: [
      {
        textUuid: 'textUuid',
        epigraphyUuids: ['uuid1', 'uuid2'],
        line: 1,
        textName: 'textName',
        reading: 'reading',
      },
    ],
  };

  const setup = () => {
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPayload).set('Authorization', 'token');

  it('returns 201 on successful discourse row insertion', async () => {
    const response = await sendRequest();
    expect(mockTextDiscourseDao.insertNewDiscourseRow).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed insertion', async () => {
    sl.set('TextDiscourseDao', {
      ...mockTextDiscourseDao,
      insertNewDiscourseRow: jest
        .fn()
        .mockRejectedValue('failed to insert new discourse row'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged-in users to insert new discourse rows', async () => {
    const response = await request(app).post(PATH).send(mockPayload);
    expect(mockTextDiscourseDao.insertNewDiscourseRow).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow users without permission to insert new discourse rows', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockTextDiscourseDao.insertNewDiscourseRow).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});

describe('POST /text_discourse_parent', () => {
  const PATH = `${API_PATH}/text_discourse_parent`;

  const mockTextDiscourseDao = {
    getDiscourseRowByUuid: jest
      .fn()
      .mockResolvedValue({ treeUuid: 'test-tree-uuid', childNum: 2 }),
    incrementObjInText: jest.fn().mockResolvedValue(),
    updateChildNum: jest.fn().mockResolvedValue(),
    insertDiscourseRow: jest.fn().mockResolvedValue(),
    updateParentUuid: jest.fn().mockResolvedValue(),
    getChildrenUuids: jest.fn().mockResolvedValue(['test-sibling-uuid']),
  };
  const mockFieldDao = {
    insertField: jest.fn().mockResolvedValue(),
  };
  const mockAliasDao = {
    insertAlias: jest.fn().mockResolvedValue(),
  };
  const mockItemPropertiesDao = {
    addProperty: jest.fn().mockResolvedValue(),
  };
  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'INSERT_PARENT_DISCOURSE_ROWS' }]),
  };
  const mockCache = {
    clear: jest.fn(),
  };

  const mockPayload = {
    textUuid: 'test-uuid',
    discourseSelections: [
      {
        uuid: 'test-uuid',
        type: 'word',
        units: [],
        spelling: 'test-spelling',
        explicitSpelling: 'test-explicit-spelling',
        transcription: 'test-transcription',
        line: 1,
        wordOnTablet: 1,
        objInText: 2,
        side: 1,
        parentUuid: 'test-parent',
        childNum: 1,
      },
    ],
    discourseType: 'Paragraph',
    newContent: 'test-content',
    properties: [
      {
        variable: {
          uuid: 'test-uuid',
          type: 'test-type',
          parentUuid: 'test-parent',
          objectUuid: 'test-obj',
          objParentUuid: 'test-obj-parent',
          variableName: 'test-var-name',
          valueName: null,
          variableUuid: 'test-var-uuid',
          valueUuid: null,
          level: 1,
          children: [],
        },
        value: {
          uuid: 'test-uuid',
          type: 'test-type',
          parentUuid: 'test-parent',
          objectUuid: 'test-obj',
          objParentUuid: 'test-obj-parent',
          variableName: null,
          valueName: 'test-val-name',
          variableUuid: null,
          valueUuid: 'test-val-uuid',
          level: 1,
          children: [],
        },
      },
    ],
  };

  const setup = () => {
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('FieldDao', mockFieldDao);
    sl.set('AliasDao', mockAliasDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPayload).set('Authorization', 'token');

  it('returns 201 on successful parent discourse insertion', async () => {
    const response = await sendRequest();
    expect(mockTextDiscourseDao.getDiscourseRowByUuid).toHaveBeenCalled();
    expect(mockTextDiscourseDao.incrementObjInText).toHaveBeenCalled();
    expect(mockTextDiscourseDao.updateChildNum).toHaveBeenCalled();
    expect(mockTextDiscourseDao.insertDiscourseRow).toHaveBeenCalled();
    expect(mockTextDiscourseDao.getChildrenUuids).toHaveBeenCalled();
    expect(mockItemPropertiesDao.addProperty).toHaveBeenCalledTimes(1);
    expect(mockAliasDao.insertAlias).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('does not allow non-logged in users to insert parent discourse rows', async () => {
    const response = await request(app).post(PATH).send(mockPayload);
    expect(mockTextDiscourseDao.insertDiscourseRow).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow users without permission to insert parent discourse rows', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockTextDiscourseDao.insertDiscourseRow).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed parent discourse insertion', async () => {
    sl.set('TextDiscourseDao', {
      ...mockTextDiscourseDao,
      insertDiscourseRow: jest
        .fn()
        .mockRejectedValue('failed to insert discourse row'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /text_discourse/:uuid', () => {
  const testUuid = 'test-uuid';
  const PATH = `${API_PATH}/text_discourse/${testUuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockFieldDao = {
    getByReferenceUuid: jest.fn().mockResolvedValue([{ uuid: 'test-uuid' }]),
    getDefinitionsByReferenceUuid: jest
      .fn()
      .mockResolvedValue([{ uuid: 'test-uuid' }]),
    getDiscussionLemmasByReferenceUuid: jest
      .fn()
      .mockResolvedValue([{ uuid: 'test-uuid' }]),
    updateField: jest.fn().mockResolvedValue(),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'EDIT_TRANSLATION' }]),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const mockPayload = {
    spelling: 'a-na',
    occurrences: [
      {
        textUuid: 'textUuid',
        epigraphyUuids: ['uuid1', 'uuid2'],
        line: 1,
        textName: 'textName',
        reading: 'reading',
      },
    ],
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('FieldDao', mockFieldDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).patch(PATH).send(mockPayload).set('Authorization', 'token');

  it('returns 201 on successful discourse translation update', async () => {
    const response = await sendRequest();
    expect(mockFieldDao.getByReferenceUuid).toHaveBeenCalled();
    expect(mockFieldDao.updateField).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('does not allow non-logged-in users to update discourse translation', async () => {
    const response = await request(app).patch(PATH).send(mockPayload);
    expect(mockFieldDao.getDefinitionsByReferenceUuid).not.toHaveBeenCalled();
    expect(
      mockFieldDao.getDiscussionLemmasByReferenceUuid
    ).not.toHaveBeenCalled();
    expect(mockFieldDao.updateField).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow users without permission to update discourse translation', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockFieldDao.getDefinitionsByReferenceUuid).not.toHaveBeenCalled();
    expect(mockFieldDao.getDefinitionsByReferenceUuid).not.toHaveBeenCalled();
    expect(mockFieldDao.updateField).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed update', async () => {
    sl.set('FieldDao', {
      ...mockFieldDao,
      getByReferenceUuid: jest
        .fn()
        .mockRejectedValue('failed to get row by reference uuid'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
