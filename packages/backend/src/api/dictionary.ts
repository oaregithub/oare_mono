import express from 'express';
import {
  DictionaryWordResponse,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  DictionaryForm,
  UpdateFormSpellingPayload,
  AddFormSpellingPayload,
  AddFormSpellingResponse,
  CheckSpellingResponse,
} from '@oare/types';
import { tokenizeExplicitSpelling } from '@oare/oare';
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

router.route('/dictionary/spellings/check').get(async (req, res, next) => {
  try {
    const spelling = (req.query.spelling as unknown) as string;

    const tokens = tokenizeExplicitSpelling(spelling);
    const errorTokens = tokens.filter((token) => token.classifier === 'ERROR');

    if (errorTokens.length > 0) {
      const response: CheckSpellingResponse = {
        errors: errorTokens.map(
          (token) => `Unexpected token: ${token.reading === String.fromCharCode(-1) ? 'EOF' : token.reading}`,
        ),
      };
      res.json(response);
      return;
    }

    const SignReadingDao = sl.get('SignReadingDao');
    const signs = tokens.filter((token) => token.classifier === 'SUPERSCRIPT' || token.classifier === 'SYLLABLE');
    const signExistences = await Promise.all(signs.map((token) => SignReadingDao.hasSign(token.reading)));

    if (signExistences.every((v) => v)) {
      const response: CheckSpellingResponse = { errors: [] };
      res.json(response);
    } else {
      const response: CheckSpellingResponse = {
        errors: signs
          .filter((_, i) => !signExistences[i])
          .map((token) => `${token.reading} is not a valid sign reading`),
      };
      res.json(response);
    }
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

router.route('/dictionary/spellings/:uuid/texts').get(async (req, res, next) => {
  try {
    const utils = sl.get('utils');
    const { uuid } = req.params;
    const { page, limit, filter } = utils.extractPagination(req.query);
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
      const utils = sl.get('utils');

      // If it doesn't exist in text_discourse, update
      const currentSpelling = await DictionarySpellingDao.getSpellingByUuid(spellingUuid);
      const discourseHasSpelling = await TextDiscourseDao.hasSpelling(spellingUuid);
      if (currentSpelling !== spelling && discourseHasSpelling) {
        next(
          new HttpBadRequest(
            'Updating a spelling that exists in text_discourse is currently not supported. Try again at a future date.',
          ),
        );
        return;
      }

      await utils.createTransaction(async (trx) => {
        if (currentSpelling !== spelling) {
          await DictionarySpellingDao.updateSpelling(spellingUuid, spelling, trx);
          await LoggingEditsDao.logEdit('UPDATE', req.user!.uuid, 'dictionary_spelling', spellingUuid, trx);
        }

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
