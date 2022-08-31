import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import * as utils from '@/utils';

describe('dictionary api test', () => {
  const mockForms = [];
  const mockGrammar = {
    uuid: 'test',
    word: 'word',
    properties: [],
    translationsForDefinition: [],
    discussionLemmas: [],
  };
  const MockDictionaryFormDao = {
    getWordForms: jest.fn().mockResolvedValue(mockForms),
    addForm: jest.fn().mockResolvedValue('new-form-uuid'),
    updateForm: jest.fn().mockResolvedValue(null),
    getDictionaryWordUuidByFormUuid: jest
      .fn()
      .mockResolvedValue('test-word-uuid'),
  };
  const MockDictionaryWordDao = {
    addWord: jest.fn().mockResolvedValue('new-word-uuid'),
    getWords: jest.fn().mockResolvedValue(['words']),
    getGrammaticalInfo: jest.fn().mockResolvedValue(mockGrammar),
    updateWordSpelling: jest.fn().mockResolvedValue(null),
    updateTranslations: jest.fn().mockResolvedValue(),
    getDictionaryWordRowByUuid: jest.fn().mockResolvedValue({
      word: 'test-word',
      type: 'word',
    }),
  };
  const MockLoggingEditsDao = {
    logEdit: jest.fn().mockResolvedValue(null),
  };
  const MockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      uuid: 'user-uuid',
    }),
  };
  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    clear: jest.fn(),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };
  const AdminUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      uuid: 'user-uuid',
      isAdmin: true,
    }),
  };
  const MockHierarchyDao = {
    createTaxonomyTree: jest.fn().mockResolvedValue(),
  };
  const mockItemPropertiesDao = {
    addProperty: jest.fn().mockResolvedValue(),
  };
  const MockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'UPDATE_FORM',
      },
      {
        name: 'UPDATE_TRANSLATION',
      },
      {
        name: 'UPDATE_WORD_SPELLING',
      },
      {
        name: 'ADD_SPELLING',
      },
      {
        name: 'ADD_FORM',
      },
      {
        name: 'DISCONNECT_SPELLING',
      },
      {
        name: 'EDIT_ITEM_PROPERTIES',
      },
      {
        name: 'ADD_LEMMA',
      },
      {
        name: 'CONNECT_SPELLING',
      },
    ]),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
    getDictionaryCacheRouteToClear: jest.fn().mockResolvedValue('/dictionary'),
  };

  const setup = ({
    FormDao,
    WordDao,
    LoggingDao,
    UserDao,
    DiscourseDao,
    cache,
    HierarchyDao,
    ItemPropertiesDao,
    PermissionsDao,
    Utils,
    DictionarySpellingDao,
  } = {}) => {
    sl.set('DictionaryFormDao', FormDao || MockDictionaryFormDao);
    sl.set('DictionaryWordDao', WordDao || MockDictionaryWordDao);
    sl.set('LoggingEditsDao', LoggingDao || MockLoggingEditsDao);
    sl.set('TextDiscourseDao', DiscourseDao);
    sl.set('UserDao', UserDao || MockUserDao);
    sl.set('cache', cache || mockCache);
    sl.set('PermissionsDao', PermissionsDao || MockPermissionsDao);
    sl.set('HierarchyDao', HierarchyDao || MockHierarchyDao);
    sl.set('ItemPropertiesDao', ItemPropertiesDao || mockItemPropertiesDao);
    sl.set('utils', Utils || mockUtils);
    sl.set('DictionarySpellingDao', DictionarySpellingDao);
  };

  describe('PATCH /connect/spellings', () => {
    const PATH = `${API_PATH}/connect/spellings`;
    const MockTextDiscourseDao = {
      updateSpellingUuid: jest.fn().mockResolvedValue(),
    };
    const mockPayload = {
      discourseUuid: 'discourseUuid',
      spellingUuid: 'spellingUuid',
    };
    const MockSpellingDao = {
      getFormUuidBySpellingUuid: jest.fn().mockResolvedValue('formUuid'),
    };

    beforeEach(() => {
      setup({
        UserDao: {
          getUserByUuid: jest.fn().mockResolvedValue({
            uuid: 'user-uuid',
            isAdmin: false,
          }),
        },
        DiscourseDao: MockTextDiscourseDao,
        DictionarySpellingDao: MockSpellingDao,
        PermissionsDao: MockPermissionsDao,
      });
    });

    const sendRequest = (auth = true) => {
      const req = request(app).patch(PATH).send(mockPayload);
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };

    it('prevents non-logged in users from patching', async () => {
      setup();
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('prevents users without permission from patching', async () => {
      setup({
        PermissionsDao: {
          getUserPermissions: jest.fn().mockResolvedValue([]),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 204', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(204);
    });

    it('updates spellingUuid in text discourse', async () => {
      await sendRequest();
      expect(MockTextDiscourseDao.updateSpellingUuid).toHaveBeenCalledWith(
        mockPayload.discourseUuid,
        mockPayload.spellingUuid
      );
    });

    it('returns 500 if text discourse dao fails', async () => {
      setup({
        UserDao: AdminUserDao,
        DiscourseDao: {
          updateSpellingUuid: jest.fn().mockRejectedValue(),
        },
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dictionary/:uuid', () => {
    const PATH = `${API_PATH}/dictionary/test`;

    it('returns word info', async () => {
      setup();
      const response = await request(app).get(PATH);
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        ...mockGrammar,
        forms: mockForms,
      });
    });

    it('uses dictionary form and word daos', async () => {
      setup();

      await request(app).get(PATH);
      expect(MockDictionaryFormDao.getWordForms).toHaveBeenCalled();
      expect(MockDictionaryWordDao.getGrammaticalInfo).toHaveBeenCalled();
    });

    it('returns 500 if form dao fails', async () => {
      setup({
        FormDao: {
          ...MockDictionaryFormDao,
          getWordForms: jest.fn().mockRejectedValue('Form failure'),
        },
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(500);
    });

    it('returns 500 if word dao fails', async () => {
      setup({
        WordDao: {
          ...MockDictionaryWordDao,
          getGrammaticalInfo: jest.fn().mockRejectedValue('Word failure'),
        },
      });

      const response = await request(app).get(PATH);
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /dictionary/:uuid', () => {
    const testUuid = 'test-uuid';
    const PATH = `${API_PATH}/dictionary/${testUuid}`;

    beforeEach(() => {
      setup({
        UserDao: AdminUserDao,
      });
    });

    const sendRequest = (auth = true) => {
      const req = request(app).patch(PATH).send({ word: 'newWord' });
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };

    it('prevents non-logged in users from posting', async () => {
      setup();
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('prevents users without permission from posting', async () => {
      setup({
        UserDao: {
          getUserByUuid: jest.fn().mockResolvedValue({
            isAdmin: false,
          }),
        },
      });
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 201', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('logs edits', async () => {
      await sendRequest();
      expect(MockLoggingEditsDao.logEdit).toHaveBeenCalled();
    });

    it('updates word spelling', async () => {
      await sendRequest();
      expect(MockDictionaryWordDao.updateWordSpelling).toHaveBeenCalled();
    });

    it('clears cache', async () => {
      await sendRequest();
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('returns 500 if logging dao fails', async () => {
      setup({
        UserDao: AdminUserDao,
        LoggingDao: {
          logEdit: jest.fn().mockRejectedValue('Logging dao failure'),
        },
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if dictionary word dao fails', async () => {
      setup({
        UserDao: AdminUserDao,
        WordDao: {
          updateWordSpelling: jest
            .fn()
            .mockRejectedValue('Dictionary word dao failure'),
        },
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /dictionary/translations/:uuid', () => {
    const testUuid = 'test-uuid';
    const PATH = `${API_PATH}/dictionary/translations/${testUuid}`;
    const mockPayload = [
      {
        uuid: 'tr-uuid',
        translation: 'test-translation',
      },
    ];

    beforeEach(() => {
      setup({
        UserDao: AdminUserDao,
      });
    });

    const sendRequest = (auth = true) => {
      const req = request(app).patch(PATH).send({ translations: mockPayload });
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };

    it('prevents users without permission from posting', async () => {
      setup();
      let response = await sendRequest(false);
      expect(response.status).toBe(401);

      setup({
        UserDao: {
          getUserByUuid: jest.fn().mockResolvedValue({
            isAdmin: false,
          }),
        },
      });
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      response = await sendRequest();

      expect(response.status).toBe(403);
    });

    it('returns 201', async () => {
      const response = await sendRequest();

      expect(response.status).toBe(201);
    });

    it('correctly updates translations', async () => {
      await sendRequest();

      expect(MockDictionaryWordDao.updateTranslations).toHaveBeenCalled();
    });

    it('clears cache', async () => {
      await sendRequest();
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it("throws 500 if update translations doesn't work", async () => {
      setup({
        UserDao: AdminUserDao,
        WordDao: {
          updateTranslations: jest.fn().mockRejectedValue('Word dao failed'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /dictionary/forms/:uuid', () => {
    const testUuid = 'test-uuid';
    const PATH = `${API_PATH}/dictionary/forms/${testUuid}`;
    const discourseUuids = ['uuid1', 'uuid2'];
    const DiscourseDao = {
      getDiscourseUuidsByFormUuid: jest.fn().mockResolvedValue(discourseUuids),
      updateDiscourseTranscription: jest.fn().mockResolvedValue(null),
    };

    beforeEach(() => {
      setup({
        UserDao: AdminUserDao,
        DiscourseDao,
      });
    });

    const sendRequest = (auth = true) => {
      const req = request(app).patch(PATH).send({ newForm: 'newForm' });
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };

    it('prevents users without permission from posting', async () => {
      setup();
      let response = await sendRequest(false);
      expect(response.status).toBe(401);

      setup({
        UserDao: {
          getUserByUuid: jest.fn().mockResolvedValue({
            isAdmin: false,
          }),
        },
      });
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 201', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('logs edits to form', async () => {
      await sendRequest();
      expect(MockLoggingEditsDao.logEdit).toHaveBeenCalled();

      discourseUuids.forEach(uuid => {
        expect(MockLoggingEditsDao.logEdit).toHaveBeenCalled();
      });
    });

    it('updates form', async () => {
      await sendRequest();
      expect(MockDictionaryFormDao.updateForm).toHaveBeenCalled();
    });

    it("returns 500 if logging doesn't work", async () => {
      setup({
        UserDao: AdminUserDao,
        LoggingDao: {
          logEdit: jest.fn().mockRejectedValue('Logging failure'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if dictionary form fails to update', async () => {
      setup({
        UserDao: AdminUserDao,
        FormDao: {
          updateForm: jest.fn().mockRejectedValue('Failed to update form'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if getting discourse uuids fails', async () => {
      setup({
        UserDao: AdminUserDao,
        DiscourseDao: {
          getDiscourseUuidsByFormUuid: jest
            .fn()
            .mockRejectedValue('Failed to get discourse uuids'),
        },
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /dictionary/spellings/:uuid', () => {
    const spellingUuid = 'spelling-uuid';
    const mockPayload = {
      spelling: 'new-spelling',
      discourseUuids: ['uuid1', 'uuid2'],
    };
    const PATH = `${API_PATH}/dictionary/spellings/${spellingUuid}`;

    const TextDiscourseDao = {
      hasSpelling: jest.fn().mockResolvedValue(false),
      updateSpellingUuid: jest.fn().mockResolvedValue(null),
    };

    const DictionarySpellingDao = {
      updateSpelling: jest.fn().mockResolvedValue(null),
      getSpellingByUuid: jest.fn().mockResolvedValue('current spelling'),
      getFormUuidBySpellingUuid: jest.fn().mockResolvedValue('form-uuid'),
    };

    beforeEach(() => {
      setup({
        UserDao: AdminUserDao,
        DiscourseDao: TextDiscourseDao,
        DictionarySpellingDao,
      });
    });

    const sendRequest = (auth = true) => {
      const req = request(app).put(PATH).send(mockPayload);
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };

    it("doesn't allow non-logged-in users to post", async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it("doesn't allow users without permission to post", async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 201', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('logs edit', async () => {
      await sendRequest();
      expect(MockLoggingEditsDao.logEdit).toHaveBeenCalled();
    });

    it('updates spelling', async () => {
      await sendRequest();
      expect(DictionarySpellingDao.updateSpelling).toHaveBeenCalled();
    });

    it('updates discourses', async () => {
      await sendRequest();

      expect(TextDiscourseDao.updateSpellingUuid).toHaveBeenCalledTimes(
        mockPayload.discourseUuids.length
      );
    });

    it('checks to see if text discourse contains the spelling', async () => {
      await sendRequest();
      expect(TextDiscourseDao.hasSpelling).toHaveBeenCalled();
    });

    it("doesn't update spelling if the spelling is the same as the current", async () => {
      sl.set('DictionarySpellingDao', {
        ...DictionarySpellingDao,
        getSpellingByUuid: jest.fn().mockResolvedValue(mockPayload.spelling),
      });

      await sendRequest();
      expect(DictionarySpellingDao.updateSpelling).not.toHaveBeenCalled();
    });

    it('returns 400 if spelling exists in text discourse', async () => {
      sl.set('TextDiscourseDao', {
        hasSpelling: jest.fn().mockResolvedValue(true),
      });
      const response = await sendRequest();
      expect(response.status).toBe(400);
    });

    it('returns 500 if updating discourse spelling uuid fails', async () => {
      sl.set('TextDiscourseDao', {
        ...TextDiscourseDao,
        updateSpellingUuid: jest
          .fn()
          .mockRejectedValue('Failed to update spelling uuid'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if checking text discourse fails', async () => {
      sl.set('TextDiscourseDao', {
        hasSpelling: jest.fn().mockRejectedValue('Failed to check spelling'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(MockLoggingEditsDao.logEdit).not.toHaveBeenCalled();
      expect(DictionarySpellingDao.updateSpelling).not.toHaveBeenCalled();
    });

    it('returns 500 if logging edit fails', async () => {
      sl.set('LoggingEditsDao', {
        logEdit: jest.fn().mockRejectedValue('Failed to log edit'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(TextDiscourseDao.updateSpellingUuid).not.toHaveBeenCalled();
    });

    it('returns 500 if updating spelling fails', async () => {
      sl.set('DictionarySpellingDao', {
        updateSpelling: jest
          .fn()
          .mockRejectedValue('Failed to update spelling'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('POST /dictionary/spellings', () => {
    const formUuid = 'form-uuid';
    const spelling = 'new-spelling';
    const newUuid = 'new-uuid';
    const discourseUuids = ['uuid1', 'uuid2'];

    const PATH = `${API_PATH}/dictionary/spellings`;
    const payload = {
      formUuid,
      spelling,
      discourseUuids,
    };

    const DictionarySpellingDao = {
      spellingExistsOnForm: jest.fn().mockResolvedValue(false),
      addSpelling: jest.fn().mockResolvedValue(newUuid),
    };

    const LoggingEditsDao = {
      logEdit: jest.fn().mockResolvedValue(null),
    };

    const TextDiscourseDao = {
      updateSpellingUuid: jest.fn().mockResolvedValue(null),
    };

    const setupAddSpelling = () => {
      sl.set('UserDao', AdminUserDao);
      sl.set('DictionarySpellingDao', DictionarySpellingDao);
      sl.set('LoggingEditsDao', LoggingEditsDao);
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('PermissionsDao', MockPermissionsDao);
      sl.set('utils', mockUtils);
    };

    const sendRequest = (auth = true) => {
      const req = request(app).post(PATH).send(payload);
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };
    it("doesn't allow non-logged-in users to post", async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it("doesn't allow users without permission to post", async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 200 on success', async () => {
      setupAddSpelling();
      const response = await sendRequest();
      expect(response.status).toBe(201);
      expect(JSON.parse(response.text)).toEqual({
        uuid: newUuid,
      });
    });

    it("checks that the new spelling doesn't already exist on the form", async () => {
      setupAddSpelling();
      await sendRequest();

      expect(DictionarySpellingDao.spellingExistsOnForm).toHaveBeenCalledWith(
        formUuid,
        spelling
      );
    });

    it('adds spelling to dictionary_spelling', async () => {
      setupAddSpelling();
      await sendRequest();

      expect(DictionarySpellingDao.addSpelling).toHaveBeenCalled();
    });

    it('logs insertion of new spelling uuid', async () => {
      setupAddSpelling();
      await sendRequest();

      expect(LoggingEditsDao.logEdit).toHaveBeenCalled();
    });

    it('updates spellings in text discourse', async () => {
      setupAddSpelling();
      await sendRequest();

      discourseUuids.forEach(uuid => {
        expect(TextDiscourseDao.updateSpellingUuid).toHaveBeenCalled();
      });
    });

    it('logs updates to text discourse', async () => {
      setupAddSpelling();
      await sendRequest();

      discourseUuids.forEach(uuid => {
        expect(LoggingEditsDao.logEdit).toHaveBeenCalled();
      });
    });

    it('returns 400 if spelling already exists on form', async () => {
      setupAddSpelling();
      sl.set('DictionarySpellingDao', {
        spellingExistsOnForm: jest.fn().mockResolvedValue(true),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
      expect(DictionarySpellingDao.addSpelling).not.toHaveBeenCalled();
      expect(TextDiscourseDao.updateSpellingUuid).not.toHaveBeenCalled();
      expect(LoggingEditsDao.logEdit).not.toHaveBeenCalled();
    });

    it('returns 500 if checking spelling existence fails', async () => {
      setupAddSpelling();
      sl.set('DictionarySpellingDao', {
        ...DictionarySpellingDao,
        spellingExistsOnForm: jest
          .fn()
          .mockRejectedValue('Failed to check if spelling exists'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(DictionarySpellingDao.addSpelling).not.toHaveBeenCalled();
      expect(LoggingEditsDao.logEdit).not.toHaveBeenCalled();
    });

    it('returns 500 if adding spelling fails', async () => {
      setupAddSpelling();
      sl.set('DictionarySpellingDao', {
        ...DictionarySpellingDao,
        addSpelling: jest.fn().mockRejectedValue('Failed to add spelling'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(LoggingEditsDao.logEdit).not.toHaveBeenCalled();
    });

    it('returns 500 if logging edit fails', async () => {
      setupAddSpelling();
      sl.set('LoggingEditsDao', {
        logEdit: jest.fn().mockRejectedValue('Failed to log'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if updating text discourse fails', async () => {
      setupAddSpelling();
      sl.set('TextDiscourseDao', {
        updateSpellingUuid: jest
          .fn()
          .mockRejectedValue('Failed to update discourse'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /dictionary/spellings/:uuid', () => {
    const spellingUuid = 'spelling-uuid';
    const PATH = `${API_PATH}/dictionary/spellings/${spellingUuid}`;
    const DictionarySpellingDao = {
      getFormUuidBySpellingUuid: jest.fn().mockResolvedValue('form-uuid'),
      deleteSpelling: jest.fn().mockResolvedValue(null),
    };

    const LoggingEditsDao = {
      logEdit: jest.fn().mockResolvedValue(null),
    };

    const TextDiscourseDao = {
      uuidsBySpellingUuid: jest.fn().mockResolvedValue(['uuid1']),
      unsetSpellingUuid: jest.fn().mockResolvedValue(),
    };

    const setupDeleteSpelling = () => {
      sl.set('UserDao', AdminUserDao);
      sl.set('DictionarySpellingDao', DictionarySpellingDao);
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('LoggingEditsDao', LoggingEditsDao);
      sl.set('PermissionsDao', MockPermissionsDao);
      sl.set('utils', mockUtils);
    };

    const sendRequest = () =>
      request(app).delete(PATH).set('Authorization', 'token');

    it("doesn't allow non-logged-in users to delete", async () => {
      const response = await request(app).delete(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow users without permission to delete", async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 201 on success', async () => {
      setupDeleteSpelling();
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('deletes spelling', async () => {
      setupDeleteSpelling();
      await sendRequest();
      expect(DictionarySpellingDao.deleteSpelling).toHaveBeenCalled();
    });

    it('logs edits', async () => {
      setupDeleteSpelling();
      await sendRequest();
      expect(LoggingEditsDao.logEdit).toHaveBeenCalled();
    });

    it('sets discourse spelling uuids to null', async () => {
      setupDeleteSpelling();
      await sendRequest();
      expect(TextDiscourseDao.unsetSpellingUuid).toHaveBeenCalled();
    });

    it('returns 500 on delete spelling error', async () => {
      setupDeleteSpelling();
      sl.set('DictionarySpellingDao', {
        deleteSpelling: jest
          .fn()
          .mockRejectedValue('Failed to delete spelling'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(DictionarySpellingDao.deleteSpelling).not.toHaveBeenCalled();
      expect(LoggingEditsDao.logEdit).not.toHaveBeenCalled();
    });

    it('returns 500 when getting uuids fails', async () => {
      setupDeleteSpelling();
      sl.set('TextDiscourseDao', {
        ...TextDiscourseDao,
        uuidsBySpellingUuid: jest.fn().mockRejectedValue('Failed to get uuids'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(LoggingEditsDao.logEdit).not.toHaveBeenCalled();
    });

    it('returns 500 when logging edits fails', async () => {
      setupDeleteSpelling();
      sl.set('LoggingEditsDao', {
        logEdit: jest.fn().mockRejectedValue('Failed to log edit'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 when text discourse update fails', async () => {
      setupDeleteSpelling();
      sl.set('TextDiscourseDao', {
        unsetSpellingUuid: jest
          .fn()
          .mockRejectedValue('Failed to update spelling uuids'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dictionary/spellings/check', () => {
    const checkSpelling = 'áb ša-ra-nim';
    const PATH = `${API_PATH}/dictionary/spellings/check`;
    const SignReadingDao = {
      hasSign: jest.fn().mockResolvedValue(true),
    };

    const checkSpellingSetup = () => {
      sl.set('SignReadingDao', SignReadingDao);
    };

    const sendRequest = spelling =>
      request(app)
        .get(PATH)
        .query({
          spelling: spelling || checkSpelling,
        });

    beforeEach(checkSpellingSetup);

    it('returns no errors when spelling is valid', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        errors: [],
      });
    });

    it('returns errors when spelling cannot parse', async () => {
      const response = await sendRequest('bad---spelling');

      expect(JSON.parse(response.text).errors.length).toBeGreaterThan(0);
    });

    it('returns errors when spelling contains signs that do not exist', async () => {
      sl.set('SignReadingDao', {
        hasSign: jest.fn().mockResolvedValue(false),
      });

      const response = await sendRequest();
      expect(JSON.parse(response.text).errors.length).toBeGreaterThan(0);
    });

    it('returns 500 when sign reading dao fails', async () => {
      sl.set('SignReadingDao', {
        hasSign: jest.fn().mockRejectedValue('sign reading dao failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dictionary/spellings/spelling_occurrences/occurrences', () => {
    const PATH = `${API_PATH}/dictionary/spellings/spelling_occurrences/occurrences`;

    const TextDiscourseDao = {
      getTotalSpellingTexts: jest.fn().mockResolvedValue(12),
    };

    const textOccurrencesSetup = () => {
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('utils', utils);
    };

    beforeEach(textOccurrencesSetup);

    const sendRequest = () => request(app).get(PATH);

    it('gets total spelling occurrences', async () => {
      const response = await sendRequest();
      expect(response.text).toBe('12');
      expect(response.status).toBe(200);
    });

    it('returns 500 on failed total occurrences retreival', async () => {
      sl.set('TextDiscourseDao', {
        ...TextDiscourseDao,
        getTotalSpellingTexts: jest
          .fn()
          .mockRejectedValue('failed to retrieve total spelling occurrences'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dictionary/spelling_occurrences/texts', () => {
    const PATH = `${API_PATH}/dictionary/spelling_occurrences/texts`;
    const mockResponse = [
      {
        textUuid: 'text-uuid',
        textName: 'text-Name',
      },
    ];

    const TextDiscourseDao = {
      getSpellingTextOccurrences: jest.fn().mockResolvedValue(mockResponse),
    };

    const TextEpigraphyDao = {
      getEpigraphicUnits: jest.fn().mockResolvedValue([]),
    };

    const spelllingOccurrencesSetup = () => {
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('TextEpigraphyDao', TextEpigraphyDao);
      sl.set('utils', utils);
    };

    beforeEach(spelllingOccurrencesSetup);

    const sendRequest = () => request(app).get(PATH);

    it('returns 200 on success', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
    });

    it('gets epigraphic units', async () => {
      await sendRequest();
      expect(TextEpigraphyDao.getEpigraphicUnits).toHaveBeenCalledTimes(
        mockResponse.length
      );
    });

    it('returns 500 when getting occurrences fails', async () => {
      sl.set('TextDiscourseDao', {
        getSpellingTextOccurrences: jest
          .fn()
          .mockRejectedValue('Failed to get spelling occurrences'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 when getting epigraphic units fails', async () => {
      sl.set('TextEpigraphyDao', {
        ...TextEpigraphyDao,
        getEpigraphicUnits: jest
          .fn()
          .mockRejectedValue('Failed to get epigraphic units'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /disconnect/spellings', () => {
    const PATH = `${API_PATH}/disconnect/spellings`;

    const mockPayload = {
      discourseUuids: ['test-uuid-1', 'test-uuid-2'],
    };

    const mockTextDiscourseDao = {
      disconnectSpelling: jest.fn().mockResolvedValue(),
    };

    const disconnectSetup = () => {
      sl.set('TextDiscourseDao', mockTextDiscourseDao);
    };

    beforeEach(disconnectSetup);

    const sendRequest = () =>
      request(app).patch(PATH).send(mockPayload).set('Authorization', 'token');

    it('returns 204 on successful spelling disconnect', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(204);
    });

    it('returns 500 on failed spelling disconnect', async () => {
      sl.set('TextDiscourseDao', {
        ...mockTextDiscourseDao,
        disconnectSpelling: jest
          .fn()
          .mockRejectedValue('failed to disconnect spellings'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 401 if user is not logged in', async () => {
      const response = await request(app).patch(PATH).send(mockPayload);
      expect(mockTextDiscourseDao.disconnectSpelling).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });

    it('returns 403 if user does not have permission to disconnect spellings', async () => {
      sl.set('PermissionsDao', {
        ...MockPermissionsDao,
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(mockTextDiscourseDao.disconnectSpelling).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });

  describe('GET /dictionary/textDiscourse/:discourseUuid', () => {
    const discourseUuid = 'discourse-uuid';
    const PATH = `${API_PATH}/dictionary/textDiscourse/discourse/${discourseUuid}`;

    const mockTextDiscourseDao = {
      getSpellingUuidsByDiscourseUuid: jest
        .fn()
        .mockResolvedValue(['spelling-uuid']),
      textDiscourseExists: jest.fn().mockResolvedValue(true),
    };

    const mockDictionarySpellingDao = {
      getFormUuidBySpellingUuid: jest.fn().mockResolvedValue('form-uuid'),
    };

    const wordForms = [{ uuid: 'form-uuid' }, { uuid: 'not-form-uuid' }];
    const mockDictionaryFormDao = {
      getDictionaryWordUuidByFormUuid: jest.fn().mockResolvedValue('word-uuid'),
      getWordForms: jest.fn().mockResolvedValue(wordForms),
    };

    const grammaticalInfo = { uuid: 'word-uuid' };
    const mockDictionaryWordDao = {
      getGrammaticalInfo: jest.fn().mockResolvedValue(grammaticalInfo),
    };

    const textDiscourseSetup = () => {
      sl.set('TextDiscourseDao', mockTextDiscourseDao);
      sl.set('DictionarySpellingDao', mockDictionarySpellingDao);
      sl.set('DictionaryFormDao', mockDictionaryFormDao);
      sl.set('DictionaryWordDao', mockDictionaryWordDao);
    };

    beforeEach(textDiscourseSetup);

    const sendRequest = () => request(app).get(PATH);

    it('returns 200 on success', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        ...grammaticalInfo,
        forms: [{ uuid: 'form-uuid' }],
      });
      expect(
        mockTextDiscourseDao.getSpellingUuidsByDiscourseUuid
      ).toHaveBeenCalled();
      expect(
        mockDictionarySpellingDao.getFormUuidBySpellingUuid
      ).toHaveBeenCalled();
      expect(
        mockDictionaryFormDao.getDictionaryWordUuidByFormUuid
      ).toHaveBeenCalled();
      expect(mockDictionaryFormDao.getWordForms).toHaveBeenCalled();
      expect(mockDictionaryWordDao.getGrammaticalInfo).toHaveBeenCalled();
    });

    it('returns 200 on success and null response when no spellings are found', async () => {
      const singleMockTextDiscourseDao = {
        getSpellingUuidsByDiscourseUuid: jest.fn().mockResolvedValue([]),
        textDiscourseExists: jest.fn().mockResolvedValue(true),
      };
      sl.set('TextDiscourseDao', {
        ...singleMockTextDiscourseDao,
      });

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(null);
      expect(
        singleMockTextDiscourseDao.getSpellingUuidsByDiscourseUuid
      ).toHaveBeenCalled();
      expect(
        mockDictionarySpellingDao.getFormUuidBySpellingUuid
      ).not.toHaveBeenCalled();
      expect(
        mockDictionaryFormDao.getDictionaryWordUuidByFormUuid
      ).not.toHaveBeenCalled();
      expect(mockDictionaryFormDao.getWordForms).not.toHaveBeenCalled();
      expect(mockDictionaryWordDao.getGrammaticalInfo).not.toHaveBeenCalled();
    });

    it('returns 400 on invalid text discourse UUID', async () => {
      sl.set('TextDiscourseDao', {
        textDiscourseExists: jest.fn().mockResolvedValue(false),
      });
      const response = await sendRequest();
      expect(response.status).toBe(400);
    });

    it('returns 500 when checking invalid text discourse UUID fails', async () => {
      sl.set('TextDiscourseDao', {
        textDiscourseExists: jest
          .fn()
          .mockRejectedValue('Failed to check if discourse uuid is valid'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 when getting spelling uuid by discourse uuid fails', async () => {
      sl.set('TextDiscourseDao', {
        getSpellingUuidsByDiscourseUuid: jest
          .fn()
          .mockRejectedValue(
            'Failed to get spelling uuids from discourse uuid'
          ),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
    it('returns 500 when getting form uuid fails', async () => {
      sl.set('DictionarySpellingDao', {
        getFormUuidBySpellingUuid: jest
          .fn()
          .mockRejectedValue('Failed to get form uuid by spelling uuid'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
    it('returns 500 when getting word uuid fails', async () => {
      sl.set('DictionaryFormDao', {
        ...mockDictionaryFormDao,
        getDictionaryWordUuidByFormUuid: jest
          .fn()
          .mockRejectedValue('Failed to get word uuid by form uuid'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
    it('returns 500 when getting word forms fails', async () => {
      sl.set('DictionaryFormDao', {
        ...mockDictionaryFormDao,
        getWordForms: jest
          .fn()
          .mockRejectedValue('Failed to get forms by word uuid'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
    it('returns 500 when getting grammatical info fails', async () => {
      sl.set('DictionaryWordDao', {
        getGrammaticalInfo: jest
          .fn()
          .mockRejectedValue('Failed to get grammatical info by word uuid'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dictionary/tree/taxonomy', () => {
    const PATH = `${API_PATH}/dictionary/tree/taxonomy`;

    beforeEach(setup);

    const sendRequest = () => request(app).get(PATH);

    it('returns 200 on successful taxonomy tree retreival', async () => {
      const response = await sendRequest();
      expect(MockHierarchyDao.createTaxonomyTree).toHaveBeenCalled();
      expect(mockCache.insert).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('returns 500 on failed taxonomy tree retreival', async () => {
      sl.set('HierarchyDao', {
        createTaxonomyTree: jest
          .fn()
          .mockRejectedValue('failed to retreive taxonomy tree'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('POST /dictionary/addform', () => {
    const PATH = `${API_PATH}/dictionary/addform`;
    const mockPayload = {
      wordUuid: 'word-uuid',
      formSpelling: 'form-spelling',
      properties: [
        {
          variable: {
            objectUuid: 'test-uuid',
            type: 'taxonomy',
            objParentUuid: 'test-parent-uuid',
            parentUuid: 'test-hierarchy-1',
            uuid: 'test-hierarchy-2',
            variableName: 'test-variable-name',
            valueName: null,
            varAbbreviation: 'test-var-abb',
            valAbbreviation: null,
            variableUuid: 'test-variable-uuid',
            valueUuid: null,
            level: null,
            children: null,
          },
          value: {
            objectUuid: 'test-uuid-2',
            type: 'taxonomy',
            objParentUuid: 'test-parent-uuid',
            parentUuid: 'test-hierarchy-2',
            uuid: 'test-hierarchy-3',
            variableName: null,
            valueName: 'test-value-name',
            varAbbreviation: null,
            valAbbreviation: 'test-val-abb',
            variableUuid: null,
            valueUuid: 'test-value-uuid',
            level: 1,
            children: null,
          },
        },
      ],
    };

    const addFormSetup = () => {
      sl.set('UserDao', AdminUserDao);
      sl.set('PermissionsDao', MockPermissionsDao);
      sl.set('DictionaryFormDao', MockDictionaryFormDao);
      sl.set('ItemPropertiesDao', mockItemPropertiesDao);
      sl.set('utils', mockUtils);
    };

    beforeEach(addFormSetup);

    const sendRequest = (auth = true) => {
      const req = request(app).post(PATH).send(mockPayload);
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };

    it('returns 201 on successfull form addition', async () => {
      const response = await sendRequest();
      expect(MockDictionaryFormDao.addForm).toHaveBeenCalled();
      expect(mockItemPropertiesDao.addProperty).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('returns 401 when user not logged in', async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('returns 403 if user does not have permission to add forms', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 500 on failed form insertion', async () => {
      sl.set('DictionaryFormDao', {
        ...MockDictionaryFormDao,
        addForm: jest.fn().mockRejectedValue('failed to add form'),
      });
      const response = await sendRequest();
      expect(mockItemPropertiesDao.addProperty).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
    });

    it('returns 500 on failed form properties insertion', async () => {
      sl.set('ItemPropertiesDao', {
        addProperty: jest
          .fn()
          .mockRejectedValue('failed to insert form properties'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('POST /dictionary/checknewword', () => {
    const PATH = `${API_PATH}/dictionary/checknewword`;

    const mockPayload = {
      wordSpelling: 'wordie',
      translation: [],
      forms: [],
      properties: [],
    };

    const existingWord = [
      {
        uuid: 'word1',
        word: 'wordie',
        translation: [],
        forms: [],
        properties: [],
      },
    ];

    const diffExistingWord = [
      {
        uuid: 'word2',
        word: 'birdie',
        translation: [],
        forms: [],
        properties: [
          {
            variable: {
              objectUuid: 'test-uuid',
              type: 'taxonomy',
              objParentUuid: 'test-parent-uuid',
              parentUuid: 'test-hierarchy-1',
              uuid: 'test-hierarchy-2',
              variableName: 'test-variable-name',
              valueName: null,
              varAbbreviation: 'test-var-abb',
              valAbbreviation: null,
              variableUuid: 'test-variable-uuid',
              valueUuid: null,
              level: null,
              children: null,
            },
            value: {
              objectUuid: 'test-uuid-2',
              type: 'taxonomy',
              objParentUuid: 'test-parent-uuid',
              parentUuid: 'test-hierarchy-2',
              uuid: 'test-hierarchy-3',
              variableName: null,
              valueName: 'test-value-name',
              varAbbreviation: null,
              valAbbreviation: 'test-val-abb',
              variableUuid: null,
              valueUuid: 'test-value-uuid',
              level: 1,
              children: null,
            },
          },
        ],
      },
    ];

    const mockDictionaryWordDao = {
      getWords: jest.fn().mockResolvedValue(existingWord),
      hasMatchingProperty: jest.fn().mockResolvedValue([false]),
    };

    const checkNewWordSetup = () => {
      sl.set('DictionaryWordDao', mockDictionaryWordDao);
      sl.set('ItemPropertiesDao', mockItemPropertiesDao);
      sl.set('utils', mockUtils);
    };

    beforeEach(checkNewWordSetup);

    const sendRequest = () => request(app).post(PATH).send(mockPayload);

    it('returns 200 if checking new word is successful', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
    });

    it('returns 500 on failed new work check', async () => {
      sl.set('DictionaryWordDao', {
        ...mockDictionaryWordDao,
        getWords: jest.fn().mockRejectedValue('failed to check lemma'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns true if new word matches an existing words spelling and properties', async () => {
      const response = await sendRequest();
      expect(mockDictionaryWordDao.getWords).toBeCalled();
      expect(response.body).toBe(true);
    });

    it('returns false if new word does not match any existing words', async () => {
      sl.set('DictionaryWordDao', {
        ...mockDictionaryWordDao,
        getWords: jest.fn().mockResolvedValue(diffExistingWord),
      });
      const response = await sendRequest();
      expect(response.body).toBe(false);
    });
  });

  describe('POST /dictionary/addword', () => {
    const PATH = `${API_PATH}/dictionary/addword`;
    const mockPayload = {
      wordSpelling: 'word-spelling',
      properties: [
        {
          variable: {
            objectUuid: 'test-uuid',
            type: 'taxonomy',
            objParentUuid: 'test-parent-uuid',
            parentUuid: 'test-hierarchy-1',
            uuid: 'test-hierarchy-2',
            variableName: 'test-variable-name',
            valueName: null,
            varAbbreviation: 'test-var-abb',
            valAbbreviation: null,
            variableUuid: 'test-variable-uuid',
            valueUuid: null,
            level: null,
            children: null,
          },
          value: {
            objectUuid: 'test-uuid-2',
            type: 'taxonomy',
            objParentUuid: 'test-parent-uuid',
            parentUuid: 'test-hierarchy-2',
            uuid: 'test-hierarchy-3',
            variableName: null,
            valueName: 'test-value-name',
            varAbbreviation: null,
            valAbbreviation: 'test-val-abb',
            variableUuid: null,
            valueUuid: 'test-value-uuid',
            level: 1,
            children: null,
          },
        },
      ],
    };

    const mockDictionaryWordDao = {
      addWord: jest.fn().mockResolvedValue('new-word-uuid'),
    };

    const addWordSetup = () => {
      sl.set('UserDao', AdminUserDao);
      sl.set('PermissionsDao', MockPermissionsDao);
      sl.set('DictionaryWordDao', mockDictionaryWordDao);
      sl.set('ItemPropertiesDao', mockItemPropertiesDao);
      sl.set('utils', mockUtils);
    };

    beforeEach(addWordSetup);

    const sendRequest = (auth = true) => {
      const req = request(app).post(PATH).send(mockPayload);
      if (auth) {
        return req.set('Authorization', 'token');
      }
      return req;
    };

    it('returns 201 on successfull lemma addition', async () => {
      const response = await sendRequest();
      expect(mockDictionaryWordDao.addWord).toHaveBeenCalled();
      expect(mockItemPropertiesDao.addProperty).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('returns 401 when user not logged in', async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('returns 403 if user does not have permission to add lemmas', async () => {
      sl.set('PermissionsDao', {
        getUserPermissions: jest.fn().mockResolvedValue([]),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 500 on failed lemma insertion', async () => {
      sl.set('DictionaryWordDao', {
        ...mockDictionaryWordDao,
        addWord: jest.fn().mockRejectedValue('failed to add lemma'),
      });
      const response = await sendRequest();
      expect(mockItemPropertiesDao.addProperty).not.toHaveBeenCalled();
      expect(response.status).toBe(500);
    });

    it('returns 500 on failed form properties insertion', async () => {
      sl.set('ItemPropertiesDao', {
        addProperty: jest
          .fn()
          .mockRejectedValue('failed to insert form properties'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
