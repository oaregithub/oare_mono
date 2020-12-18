import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';
import utils from '@/utils';

describe('dictionary api test', () => {
  const mockForms = [];
  const mockGrammar = {
    uuid: 'test',
    word: 'word',
    partsOfSpeech: [],
    specialClassifications: [],
    translations: [],
    verbalThematicVowelTypes: [],
  };
  const MockDictionaryFormDao = {
    getWordForms: jest.fn().mockResolvedValue(mockForms),
  };
  const MockDictionaryWordDao = {
    getGrammaticalInfo: jest.fn().mockResolvedValue(mockGrammar),
    updateWordSpelling: jest.fn().mockResolvedValue(null),
  };
  const MockLoggingEditsDao = {
    logEdit: jest.fn().mockResolvedValue(null),
  };
  const MockUserDao = {
    getUserByEmail: jest.fn().mockResolvedValue(null),
  };
  const mockCache = {
    clear: jest.fn(),
  };
  const AdminUserDao = {
    getUserByEmail: jest.fn().mockResolvedValue({
      uuid: 'user-uuid',
      isAdmin: true,
    }),
  };

  const setup = ({ FormDao, WordDao, LoggingDao, UserDao, DiscourseDao, cache } = {}) => {
    sl.set('DictionaryFormDao', FormDao || MockDictionaryFormDao);
    sl.set('DictionaryWordDao', WordDao || MockDictionaryWordDao);
    sl.set('LoggingEditsDao', LoggingDao || MockLoggingEditsDao);
    sl.set('TextDiscourseDao', DiscourseDao);
    sl.set('UserDao', UserDao || MockUserDao);
    sl.set('cache', cache || mockCache);
  };

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

  describe('POST /dictionary/:uuid', () => {
    const testUuid = 'test-uuid';
    const PATH = `${API_PATH}/dictionary/${testUuid}`;

    beforeEach(() => {
      setup({
        UserDao: AdminUserDao,
      });
    });

    it('prevents non-logged in users from posting', async () => {
      setup();
      const response = await request(app).post(PATH).send({ word: 'newWord' });
      expect(response.status).toBe(401);
    });

    it('prevents non-admins from posting', async () => {
      setup({
        UserDao: {
          getUserByEmail: jest.fn().mockResolvedValue({
            isAdmin: false,
          }),
        },
      });

      const response = await request(app).post(PATH).send({ word: 'newWord' }).set('Cookie', 'jwt=token');
      expect(response.status).toBe(403);
    });

    it('returns 200', async () => {
      const response = await request(app).post(PATH).send({ word: 'newWord' }).set('Cookie', 'jwt=token');
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        word: 'newWord',
      });
    });

    it('logs edits', async () => {
      await request(app).post(PATH).send({ word: 'newWord' }).set('Cookie', 'jwt=token');
      expect(MockLoggingEditsDao.logEdit).toHaveBeenCalledWith('UPDATE', 'user-uuid', 'dictionary_word', testUuid);
    });

    it('updates word spelling', async () => {
      await request(app).post(PATH).send({ word: 'newWord' }).set('Cookie', 'jwt=token');
      expect(MockDictionaryWordDao.updateWordSpelling).toHaveBeenCalledWith(testUuid, 'newWord');
    });

    it('clears cache', async () => {
      await request(app).post(PATH).send({ word: 'newWord' }).set('Cookie', 'jwt=token');
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('returns 500 if logging dao fails', async () => {
      setup({
        UserDao: AdminUserDao,
        LoggingDao: {
          logEdit: jest.fn().mockRejectedValue('Logging dao failure'),
        },
      });
      const response = await request(app).post(PATH).send({ word: 'newWord' }).set('Cookie', 'jwt=token');
      expect(response.status).toBe(500);
    });

    it('returns 500 if dictionary word dao fails', async () => {
      setup({
        UserDao: AdminUserDao,
        WordDao: {
          updateWordSpelling: jest.fn().mockRejectedValue('Dictionary word dao failure'),
        },
      });
      const response = await request(app).post(PATH).send({ word: 'newWord' }).set('Cookie', 'jwt=token');
      expect(response.status).toBe(500);
    });
  });

  describe('POST /dictionary/translations/:uuid', () => {
    const testUuid = 'test-uuid';
    const PATH = `${API_PATH}/dictionary/translations/${testUuid}`;
    const updatedTranslations = [
      {
        uuid: 'tr-uuid',
        translation: 'test-translation',
      },
    ];
    const TranslationWordDao = {
      updateTranslations: jest.fn().mockResolvedValue(updatedTranslations),
    };

    beforeEach(() => {
      setup({
        UserDao: AdminUserDao,
        WordDao: TranslationWordDao,
      });
    });

    it('prevents non-admins from posting', async () => {
      setup();
      let response = await request(app).post(PATH).send({ translations: updatedTranslations });
      expect(response.status).toBe(401);

      setup({
        UserDao: {
          getUserByEmail: jest.fn().mockResolvedValue({
            isAdmin: false,
          }),
        },
      });
      response = await request(app).post(PATH).send({ translations: updatedTranslations }).set('Cookie', 'jwt=token');

      expect(response.status).toBe(403);
    });

    it('returns 200', async () => {
      const response = await request(app)
        .post(PATH)
        .send({ translations: updatedTranslations })
        .set('Cookie', 'jwt=token');

      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        translations: updatedTranslations,
      });
    });

    it('correctly updates translations', async () => {
      await request(app).post(PATH).send({ translations: updatedTranslations }).set('Cookie', 'jwt=token');

      expect(TranslationWordDao.updateTranslations).toHaveBeenCalledWith('user-uuid', testUuid, updatedTranslations);
    });

    it('clears cache', async () => {
      await request(app).post(PATH).send({ translations: updatedTranslations }).set('Cookie', 'jwt=token');
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it("throws 500 if update translations doesn't work", async () => {
      setup({
        UserDao: AdminUserDao,
        WordDao: {
          updateTranslations: jest.fn().mockRejectedValue('Word dao failed'),
        },
      });

      const response = await request(app)
        .post(PATH)
        .send({ translations: updatedTranslations })
        .set('Cookie', 'jwt=token');
      expect(response.status).toBe(500);
    });
  });

  describe('POST /dictionary/forms/:uuid', () => {
    const testUuid = 'test-uuid';
    const PATH = `${API_PATH}/dictionary/forms/${testUuid}`;
    const discourseUuids = ['uuid1', 'uuid2'];
    const DiscourseDao = {
      getDiscourseUuidsByFormUuid: jest.fn().mockResolvedValue(discourseUuids),
      updateDiscourseTranscription: jest.fn().mockResolvedValue(null),
    };
    const FormDao = {
      updateForm: jest.fn().mockResolvedValue(null),
    };

    beforeEach(() => {
      setup({
        UserDao: AdminUserDao,
        DiscourseDao,
        FormDao,
      });
    });

    it('prevents non-admins from posting', async () => {
      setup();
      let response = await request(app).post(PATH).send({ uuid: 'test-uuid', form: 'newForm' });
      expect(response.status).toBe(401);

      setup({
        UserDao: {
          getUserByEmail: jest.fn().mockResolvedValue({
            isAdmin: false,
          }),
        },
      });
      response = await request(app).post(PATH).send({ uuid: 'form-uuid', form: 'newForm' }).set('Cookie', 'jwt=token');
      expect(response.status).toBe(403);
    });

    it('returns 200', async () => {
      const response = await request(app)
        .post(PATH)
        .send({ uuid: 'form-uuid', form: 'newForm' })
        .set('Cookie', 'jwt=token');
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        uuid: testUuid,
        form: {
          uuid: 'form-uuid',
          form: 'newForm',
        },
      });
    });

    it('logs edits to form', async () => {
      await request(app).post(PATH).send({ uuid: testUuid, form: 'newForm' }).set('Cookie', 'jwt=token');
      expect(MockLoggingEditsDao.logEdit).toHaveBeenCalledWith('UPDATE', 'user-uuid', 'dictionary_form', testUuid);

      discourseUuids.forEach((uuid) => {
        expect(MockLoggingEditsDao.logEdit).toHaveBeenCalledWith('UPDATE', 'user-uuid', 'text_discourse', uuid);
      });
    });

    it('updates form', async () => {
      await request(app).post(PATH).send({ uuid: testUuid, form: 'newForm' }).set('Cookie', 'jwt=token');
      expect(FormDao.updateForm).toHaveBeenCalledWith(testUuid, 'newForm');
    });

    it('updates discourse transcriptions', async () => {
      await request(app).post(PATH).send({ uuid: testUuid, form: 'newForm' }).set('Cookie', 'jwt=token');

      discourseUuids.forEach((uuid) => {
        expect(DiscourseDao.updateDiscourseTranscription).toHaveBeenCalledWith(uuid, 'newForm');
      });
    });

    it("returns 500 if logging doesn't work", async () => {
      setup({
        UserDao: AdminUserDao,
        LoggingDao: {
          logEdit: jest.fn().mockRejectedValue('Logging failure'),
        },
      });

      const response = await request(app)
        .post(PATH)
        .send({ uuid: testUuid, form: 'newForm' })
        .set('Cookie', 'jwt=token');
      expect(response.status).toBe(500);
    });

    it('returns 500 if dictionary form fails to update', async () => {
      setup({
        UserDao: AdminUserDao,
        FormDao: {
          updateForm: jest.fn().mockRejectedValue('Failed to update form'),
        },
      });

      const response = await request(app)
        .post(PATH)
        .send({ uuid: testUuid, form: 'newForm' })
        .set('Cookie', 'jwt=token');
      expect(response.status).toBe(500);
    });

    it('returns 500 if getting discourse uuids fails', async () => {
      setup({
        UserDao: AdminUserDao,
        FormDao,
        DiscourseDao: {
          getDiscourseUuidsByFormUuid: jest.fn().mockRejectedValue('Failed to get discourse uuids'),
        },
      });

      const response = await request(app)
        .post(PATH)
        .send({ uuid: testUuid, form: 'newForm' })
        .set('Cookie', 'jwt=token');
      expect(response.status).toBe(500);
    });

    it('returns 500 if updating discourse transcription fails', async () => {
      setup({
        UserDao: AdminUserDao,
        FormDao,
        DiscourseDao: {
          ...DiscourseDao,
          updateDiscourseTranscription: jest.fn().mockRejectedValue('Cannot update discourse transcription'),
        },
      });

      const response = await request(app)
        .post(PATH)
        .send({ uuid: testUuid, form: 'newForm' })
        .set('Cookie', 'jwt=token');
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

    const LoggingEditsDao = {
      logEdit: jest.fn().mockResolvedValue(null),
    };

    const DictionarySpellingDao = {
      updateSpelling: jest.fn().mockResolvedValue(null),
      getSpellingByUuid: jest.fn().mockResolvedValue('current spelling'),
    };

    const mockUtils = {
      createTransaction: jest.fn(async (cb) => {
        await cb();
      }),
    };

    const setupPostForm = () => {
      sl.set('UserDao', AdminUserDao);
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('LoggingEditsDao', LoggingEditsDao);
      sl.set('DictionarySpellingDao', DictionarySpellingDao);
      sl.set('utils', mockUtils);
    };

    const sendRequest = () => request(app).put(PATH).send(mockPayload).set('Cookie', 'jwt=token');

    it("doesn't allow non-logged-in users to post", async () => {
      const response = await request(app).put(PATH).send(mockPayload);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to post", async () => {
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 201', async () => {
      setupPostForm();
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('logs edit', async () => {
      setupPostForm();
      await sendRequest();
      expect(LoggingEditsDao.logEdit).toHaveBeenCalled();
    });

    it('updates spelling', async () => {
      setupPostForm();
      await sendRequest();
      expect(DictionarySpellingDao.updateSpelling).toHaveBeenCalled();
    });

    it('updates discourses', async () => {
      setupPostForm();
      await sendRequest();

      expect(TextDiscourseDao.updateSpellingUuid).toHaveBeenCalledTimes(mockPayload.discourseUuids.length);
    });

    it('checks to see if text discourse contains the spelling', async () => {
      setupPostForm();
      await sendRequest();
      expect(TextDiscourseDao.hasSpelling).toHaveBeenCalled();
    });

    it("doesn't update spelling if the spelling is the same as the current", async () => {
      setupPostForm();
      sl.set('DictionarySpellingDao', {
        ...DictionarySpellingDao,
        getSpellingByUuid: jest.fn().mockResolvedValue(mockPayload.spelling),
      });

      await sendRequest();
      expect(DictionarySpellingDao.updateSpelling).not.toHaveBeenCalled();
    });

    it('returns 400 if spelling exists in text discourse', async () => {
      setupPostForm();
      sl.set('TextDiscourseDao', {
        hasSpelling: jest.fn().mockResolvedValue(true),
      });
      const response = await sendRequest();
      expect(response.status).toBe(400);
    });

    it('returns 500 if updating discourse spelling uuid fails', async () => {
      setupPostForm();
      sl.set('TextDiscourseDao', {
        ...TextDiscourseDao,
        updateSpellingUuid: jest.fn().mockRejectedValue('Failed to update spelling uuid'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if checking text discourse fails', async () => {
      setupPostForm();
      sl.set('TextDiscourseDao', {
        hasSpelling: jest.fn().mockRejectedValue('Failed to check spelling'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(LoggingEditsDao.logEdit).not.toHaveBeenCalled();
      expect(DictionarySpellingDao.updateSpelling).not.toHaveBeenCalled();
    });

    it('returns 500 if logging edit fails', async () => {
      setupPostForm();
      sl.set('LoggingEditsDao', {
        logEdit: jest.fn().mockRejectedValue('Failed to log edit'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(TextDiscourseDao.updateSpellingUuid).not.toHaveBeenCalled();
    });

    it('returns 500 if updating spelling fails', async () => {
      setupPostForm();
      sl.set('DictionarySpellingDao', {
        updateSpelling: jest.fn().mockRejectedValue('Failed to update spelling'),
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
    };

    const sendRequest = () => request(app).post(PATH).send(payload).set('Cookie', 'jwt=token');

    it("doesn't allow non-logged-in users to post", async () => {
      const response = await request(app).post(PATH).send(payload);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to post", async () => {
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 200 on success', async () => {
      setupAddSpelling();
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        uuid: newUuid,
      });
    });

    it("checks that the new spelling doesn't already exist on the form", async () => {
      setupAddSpelling();
      await sendRequest();

      expect(DictionarySpellingDao.spellingExistsOnForm).toHaveBeenCalledWith(formUuid, spelling);
    });

    it('adds spelling to dictionary_spelling', async () => {
      setupAddSpelling();
      await sendRequest();

      expect(DictionarySpellingDao.addSpelling).toHaveBeenCalledWith(formUuid, spelling);
    });

    it('logs insertion of new spelling uuid', async () => {
      setupAddSpelling();
      await sendRequest();

      expect(LoggingEditsDao.logEdit).toHaveBeenCalledWith('INSERT', 'user-uuid', 'dictionary_spelling', newUuid);
    });

    it('updates spellings in text discourse', async () => {
      setupAddSpelling();
      await sendRequest();

      discourseUuids.forEach((uuid) => {
        expect(TextDiscourseDao.updateSpellingUuid).toHaveBeenCalledWith(uuid, newUuid);
      });
    });

    it('logs updates to text discourse', async () => {
      setupAddSpelling();
      await sendRequest();

      discourseUuids.forEach((uuid) => {
        expect(LoggingEditsDao.logEdit).toHaveBeenCalledWith('UPDATE', 'user-uuid', 'text_discourse', uuid);
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
        spellingExistsOnForm: jest.fn().mockRejectedValue('Failed to check if spelling exists'),
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
        updateSpellingUuid: jest.fn().mockRejectedValue('Failed to update discourse'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /dictionary/spellings/:uuid', () => {
    const spellingUuid = 'spelling-uuid';
    const PATH = `${API_PATH}/dictionary/spellings/${spellingUuid}`;
    const DictionarySpellingDao = {
      deleteSpelling: jest.fn().mockResolvedValue(null),
    };

    const LoggingEditsDao = {
      logEdit: jest.fn().mockResolvedValue(null),
    };

    const TextDiscourseDao = {
      uuidsBySpellingUuid: jest.fn().mockResolvedValue(['uuid1']),
      unsetSpellingUuid: jest.fn(async (_uuid, cb) => {
        await cb();
      }),
    };

    const setupDeleteSpelling = () => {
      sl.set('UserDao', AdminUserDao);
      sl.set('DictionarySpellingDao', DictionarySpellingDao);
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('LoggingEditsDao', LoggingEditsDao);
    };

    const sendRequest = () => request(app).delete(PATH).set('Cookie', 'jwt=token');

    it("doesn't allow non-logged-in users to delete", async () => {
      const response = await request(app).delete(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to delete", async () => {
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
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
        deleteSpelling: jest.fn().mockRejectedValue('Failed to delete spelling'),
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
        unsetSpellingUuid: jest.fn().mockRejectedValue('Failed to update spelling uuids'),
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

    const sendRequest = (spelling) =>
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

  describe('GET /dictionary/spellings/:uuid/texts', () => {
    const spellingUuid = 'spelling-uuid';
    const PATH = `${API_PATH}/dictionary/spellings/${spellingUuid}/texts`;
    const spelllingOccurrences = [
      {
        textUuid: 'text-uuid',
        textName: 'text-Name',
      },
    ];
    const mockResponse = {
      totalOccurrences: 1,
      rows: spelllingOccurrences,
    };
    const TextDiscourseDao = {
      getSpellingTextOccurrences: jest.fn().mockResolvedValue(mockResponse),
    };

    const TextEpigraphyDao = {
      getEpigraphicUnits: jest.fn().mockResolvedValue([]),
    };

    const TextMarkupDao = {
      getMarkups: jest.fn().mockResolvedValue([]),
    };

    const spelllingOccurrencesSetup = () => {
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('TextEpigraphyDao', TextEpigraphyDao);
      sl.set('TextMarkupDao', TextMarkupDao);
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
      expect(TextEpigraphyDao.getEpigraphicUnits).toHaveBeenCalledTimes(spelllingOccurrences.length);
    });

    it('gets markup units', async () => {
      await sendRequest();
      expect(TextMarkupDao.getMarkups).toHaveBeenCalled();
    });

    it('returns 500 when getting occurrences fails', async () => {
      sl.set('TextDiscourseDao', {
        getSpellingTextOccurrences: jest.fn().mockRejectedValue('Failed to get spelling occurrences'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 when getting epigraphic units fails', async () => {
      sl.set('TextEpigraphyDao', {
        ...TextEpigraphyDao,
        getEpigraphicUnits: jest.fn().mockRejectedValue('Failed to get epigraphic units'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 when getting markup units fails', async () => {
      sl.set('TextMarkupDao', {
        getMarkups: jest.fn().mockRejectedValue('Failed to get markup units'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
