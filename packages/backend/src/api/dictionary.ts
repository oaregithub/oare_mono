import express from 'express';
import {
  DictionaryWordResponse,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  DictionaryForm,
  UpdateFormSpellingPayload,
  AddFormSpellingPayload,
  AddFormSpellingResponse,
} from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { API_PATH } from '@/setupRoutes';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/dictionary/spellings').post(adminRoute, async (req, res, next) => {
  try {
    const DictionarySpellingDao = sl.get('DictionarySpellingDao');
    const LoggingEditsDao = sl.get('LoggingEditsDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const { formUuid, spelling, discourseUuids }: AddFormSpellingPayload = req.body;
    const spellingExists = await DictionarySpellingDao.spellingExistsOnForm(formUuid, spelling);

    if (spellingExists) {
      next(new HttpBadRequest('Spelling already exists on form'));
      return;
    }

    const spellingUuid = await DictionarySpellingDao.addSpelling(formUuid, spelling);
    await LoggingEditsDao.logEdit('INSERT', req.user!.uuid, 'dictionary_spelling', spellingUuid);

    await Promise.all(
      discourseUuids.map((discourseUuid) =>
        LoggingEditsDao.logEdit('UPDATE', req.user!.uuid, 'text_discourse', discourseUuid),
      ),
    );
    await Promise.all(
      discourseUuids.map((discourseUuid) => TextDiscourseDao.updateSpellingUuid(discourseUuid, spellingUuid)),
    );

    const response: AddFormSpellingResponse = { uuid: spellingUuid };
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/dictionary/:uuid')
  .get(async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const { uuid } = req.params;

      const grammarInfo = await DictionaryWordDao.getGrammaticalInfo(uuid);
      const forms = await DictionaryFormDao.getWordForms(uuid);

      const result: DictionaryWordResponse = {
        ...grammarInfo,
        forms,
      };
      res.json(result);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;
      const { word }: UpdateDictionaryWordPayload = req.body;
      const userUuid = req.user!.uuid;

      await LoggingEditsDao.logEdit('UPDATE', userUuid, 'dictionary_word', uuid);
      await DictionaryWordDao.updateWordSpelling(uuid, word);

      // Updated word, cache must be cleared
      cache.clear({
        req: {
          originalUrl: `${API_PATH}/words`,
          method: 'GET',
        },
      });
      res.json({ word });
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/dictionary/translations/:uuid').post(adminRoute, async (req, res, next) => {
  try {
    const cache = sl.get('cache');
    const DictionaryWordDao = sl.get('DictionaryWordDao');

    const { uuid } = req.params;
    const { translations }: UpdateDictionaryTranslationPayload = req.body;

    const updatedTranslations = await DictionaryWordDao.updateTranslations(req.user!.uuid, uuid, translations);

    // Updated word, cache must be cleared
    cache.clear({
      req: {
        originalUrl: `${API_PATH}/words`,
        method: 'GET',
      },
    });
    res.json({
      translations: updatedTranslations,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/dictionary/forms/:uuid').post(adminRoute, async (req, res, next) => {
  try {
    const DictionaryFormDao = sl.get('DictionaryFormDao');
    const LoggingEditsDao = sl.get('LoggingEditsDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const { uuid: formUuid } = req.params;
    const formData: DictionaryForm = req.body;
    const userUuid = req.user!.uuid;

    await LoggingEditsDao.logEdit('UPDATE', userUuid, 'dictionary_form', formUuid);
    await DictionaryFormDao.updateForm(formUuid, formData.form);

    const discourseUuids = await TextDiscourseDao.getDiscourseUuidsByFormUuid(formUuid);
    await Promise.all(
      discourseUuids.map((uuid) => LoggingEditsDao.logEdit('UPDATE', userUuid, 'text_discourse', uuid)),
    );
    await Promise.all(discourseUuids.map((uuid) => TextDiscourseDao.updateDiscourseTranscription(uuid, formData.form)));
    res.json({
      uuid: formUuid,
      form: formData,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/dictionary/spellings/:uuid')
  .put(adminRoute, async (req, res, next) => {
    try {
      const { uuid: spellingUuid } = req.params;
      const { spelling, discourseUuids }: UpdateFormSpellingPayload = req.body;
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');

      // If it doesn't exist in text_discourse, update
      const hasSpelling = await TextDiscourseDao.hasSpelling(spellingUuid);
      if (hasSpelling) {
        next(
          new HttpBadRequest(
            'Updating a spelling that exists in text_discourse is currently not supported. Try again at a future date.',
          ),
        );
        return;
      }

      await DictionarySpellingDao.updateSpelling(spellingUuid, spelling, async (trx) => {
        await LoggingEditsDao.logEdit('UPDATE', req.user!.uuid, 'dictionary_spelling', spellingUuid, trx);
        await Promise.all(
          discourseUuids.map((discourseUuid) =>
            LoggingEditsDao.logEdit('UPDATE', req.user!.uuid, 'text_discourse', discourseUuid, trx),
          ),
        );
        await Promise.all(
          discourseUuids.map((discourseUuid) => TextDiscourseDao.updateSpellingUuid(discourseUuid, spellingUuid, trx)),
        );
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');

      await TextDiscourseDao.unsetSpellingUuid(uuid, async (trx) => {
        await DictionarySpellingDao.deleteSpelling(uuid, trx);

        const discourseRowUuids = await TextDiscourseDao.uuidsBySpellingUuid(uuid, trx);
        await Promise.all(
          discourseRowUuids.map((rowUuid) =>
            LoggingEditsDao.logEdit('UPDATE', req.user!.uuid, 'text_discourse', rowUuid, trx),
          ),
        );
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
