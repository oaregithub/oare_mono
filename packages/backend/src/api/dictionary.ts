import express from 'express';
import {
  DictionaryWordResponse,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  DictionaryForm,
} from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpInternalError } from '@/exceptions';
import { API_PATH } from '@/setupRoutes';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/dictionary/:uuid')
  .get(async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const { uuid } = req.params;

      const grammarInfo = await DictionaryWordDao.getGrammaticalInfo(uuid);
      const forms = await DictionaryFormDao.getForms(uuid);

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

export default router;
