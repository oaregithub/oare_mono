import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

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
    getForms: jest.fn().mockResolvedValue(mockForms),
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
      expect(MockDictionaryFormDao.getForms).toHaveBeenCalled();
      expect(MockDictionaryWordDao.getGrammaticalInfo).toHaveBeenCalled();
    });

    it('returns 500 if form dao fails', async () => {
      setup({
        FormDao: {
          ...MockDictionaryFormDao,
          getForms: jest.fn().mockRejectedValue('Form failure'),
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

  describe('POST /dictionary/spellings/:uuid', () => {
    const spellingUuid = 'spelling-uuid';
    const mockPayload = {
      spelling: 'new-spelling',
    };
    const PATH = `${API_PATH}/dictionary/spellings/${spellingUuid}`;

    const TextDiscourseDao = {
      hasSpelling: jest.fn().mockResolvedValue(false),
    };

    const LoggingEditsDao = {
      logEdit: jest.fn().mockResolvedValue(null),
    };

    const DictionarySpellingDao = {
      updateSpelling: jest.fn().mockResolvedValue(null),
    };

    const setupPostForm = () => {
      sl.set('UserDao', AdminUserDao);
      sl.set('TextDiscourseDao', TextDiscourseDao);
      sl.set('LoggingEditsDao', LoggingEditsDao);
      sl.set('DictionarySpellingDao', DictionarySpellingDao);
    };

    const sendRequest = () => request(app).post(PATH).send(mockPayload).set('Cookie', 'jwt=token');

    it("doesn't allow non-logged-in users to post", async () => {
      const response = await request(app).post(PATH).send(mockPayload);
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
      expect(LoggingEditsDao.logEdit).toHaveBeenCalledWith('UPDATE', 'user-uuid', 'dictionary_spelling', spellingUuid);
    });

    it('updates spelling', async () => {
      setupPostForm();
      await sendRequest();
      expect(DictionarySpellingDao.updateSpelling).toHaveBeenCalledWith(spellingUuid, mockPayload.spelling);
    });

    it('checks to see if text discourse contains the spelling', async () => {
      setupPostForm();
      await sendRequest();
      expect(TextDiscourseDao.hasSpelling).toHaveBeenCalled();
    });

    it('returns 400 if spelling exists in text discourse', async () => {
      setupPostForm();
      sl.set('TextDiscourseDao', {
        hasSpelling: jest.fn().mockResolvedValue(true),
      });
      const response = await sendRequest();
      expect(response.status).toBe(400);
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
      expect(DictionarySpellingDao.updateSpelling).not.toHaveBeenCalled();
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
});
