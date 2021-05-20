import express from 'express';
import _ from 'lodash';
import {
  Word,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  DictionaryForm,
  UpdateFormSpellingPayload,
  AddFormSpellingPayload,
  AddFormSpellingResponse,
  CheckSpellingResponse,
  Token,
} from '@oare/types';
import {
  tokenizeExplicitSpelling,
  createTabletRenderer,
  normalizeSign,
} from '@oare/oare';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { API_PATH } from '@/setupRoutes';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/dictionary/spellings')
  .post(permissionsRoute('ADD_SPELLING'), async (req, res, next) => {
    try {
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const {
        formUuid,
        spelling,
        discourseUuids,
      }: AddFormSpellingPayload = req.body;
      const spellingExists = await DictionarySpellingDao.spellingExistsOnForm(
        formUuid,
        spelling
      );

      if (spellingExists) {
        next(new HttpBadRequest('Spelling already exists on form'));
        return;
      }

      const spellingUuid = await DictionarySpellingDao.addSpelling(
        formUuid,
        spelling
      );
      await LoggingEditsDao.logEdit(
        'INSERT',
        req.user!.uuid,
        'dictionary_spelling',
        spellingUuid
      );

      await Promise.all(
        discourseUuids.map(discourseUuid =>
          LoggingEditsDao.logEdit(
            'UPDATE',
            req.user!.uuid,
            'text_discourse',
            discourseUuid
          )
        )
      );
      await Promise.all(
        discourseUuids.map(discourseUuid =>
          TextDiscourseDao.updateSpellingUuid(discourseUuid, spellingUuid)
        )
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

    let tokens: Token[];

    try {
      tokens = tokenizeExplicitSpelling(spelling);
    } catch (e) {
      let response: CheckSpellingResponse;
      if (e.hash) {
        const {
          hash: {
            loc: { last_column: errorIndex },
          },
        } = e;

        let errorChar = spelling[errorIndex];
        if (errorIndex === spelling.length) {
          errorChar = 'EOF';
        }
        response = {
          errors: [`Unexpected token: ${errorChar}`],
        };
      } else {
        response = {
          errors: ['Invalid grammar'],
        };
      }
      res.json(response);
      return;
    }

    const SignReadingDao = sl.get('SignReadingDao');
    const signs = tokens.filter(({ tokenType }) => tokenType === 'SIGN');
    const signExistences = await Promise.all(
      signs.map(token => SignReadingDao.hasSign(normalizeSign(token.tokenText)))
    );

    if (signExistences.every(v => v)) {
      const response: CheckSpellingResponse = { errors: [] };
      res.json(response);
    } else {
      const response: CheckSpellingResponse = {
        errors: signs
          .filter((_exists, i) => !signExistences[i])
          .map(
            token =>
              `${normalizeSign(token.tokenText)} is not a valid sign reading`
          ),
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

      const result: Word = {
        ...grammarInfo,
        forms,
      };
      res.json(result);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(permissionsRoute('UPDATE_WORD_SPELLING'), async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;
      const { word }: UpdateDictionaryWordPayload = req.body;
      const userUuid = req.user!.uuid;

      await LoggingEditsDao.logEdit(
        'UPDATE',
        userUuid,
        'dictionary_word',
        uuid
      );
      await DictionaryWordDao.updateWordSpelling(uuid, word);

      // Updated word, cache must be cleared
      cache.clear(
        {
          req: {
            originalUrl: `${API_PATH}/words`,
            method: 'GET',
          },
        },
        { exact: false }
      );
      res.json({ word });
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/dictionary/translations/:uuid')
  .post(permissionsRoute('UPDATE_TRANSLATION'), async (req, res, next) => {
    try {
      const cache = sl.get('cache');
      const DictionaryWordDao = sl.get('DictionaryWordDao');

      const { uuid } = req.params;
      const { translations }: UpdateDictionaryTranslationPayload = req.body;

      const updatedTranslations = await DictionaryWordDao.updateTranslations(
        req.user!.uuid,
        uuid,
        translations
      );

      // Updated word, cache must be cleared
      cache.clear(
        {
          req: {
            originalUrl: `${API_PATH}/words`,
            method: 'GET',
          },
        },
        { exact: false }
      );
      res.json({
        translations: updatedTranslations,
      });
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/dictionary/forms/:uuid')
  .post(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const { uuid: formUuid } = req.params;
      const formData: DictionaryForm = req.body;
      const userUuid = req.user!.uuid;

      await LoggingEditsDao.logEdit(
        'UPDATE',
        userUuid,
        'dictionary_form',
        formUuid
      );
      await DictionaryFormDao.updateForm(formUuid, formData.form);

      const discourseUuids = await TextDiscourseDao.getDiscourseUuidsByFormUuid(
        formUuid
      );
      await Promise.all(
        discourseUuids.map(uuid =>
          LoggingEditsDao.logEdit('UPDATE', userUuid, 'text_discourse', uuid)
        )
      );
      await Promise.all(
        discourseUuids.map(uuid =>
          TextDiscourseDao.updateDiscourseTranscription(uuid, formData.form)
        )
      );
      res.json({
        uuid: formUuid,
        form: formData,
      });
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/dictionary/spellings/:uuid/occurrences')
  .get(async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const utils = sl.get('utils');
      const { filter } = utils.extractPagination(req.query);
      const { uuid } = req.params;
      const totalOccurrences = await TextDiscourseDao.getTotalSpellingTexts(
        uuid,
        { filter }
      );

      res.json(totalOccurrences);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/dictionary/spellings/:uuid/texts')
  .get(async (req, res, next) => {
    try {
      const utils = sl.get('utils');
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const { uuid } = req.params;
      const pagination = utils.extractPagination(req.query);

      const rows = await TextDiscourseDao.getSpellingTextOccurrences(
        uuid,
        pagination
      );

      const response = await utils.getTextOccurrences(rows);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/dictionary/spellings/:uuid')
  .put(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const { uuid: spellingUuid } = req.params;
      const { spelling, discourseUuids }: UpdateFormSpellingPayload = req.body;
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const utils = sl.get('utils');

      // If it doesn't exist in text_discourse, update
      const currentSpelling = await DictionarySpellingDao.getSpellingByUuid(
        spellingUuid
      );
      const discourseHasSpelling = await TextDiscourseDao.hasSpelling(
        spellingUuid
      );
      if (currentSpelling !== spelling && discourseHasSpelling) {
        next(
          new HttpBadRequest(
            'Updating a spelling that exists in text_discourse is currently not supported. Try again at a future date.'
          )
        );
        return;
      }

      await utils.createTransaction(async trx => {
        if (currentSpelling !== spelling) {
          await DictionarySpellingDao.updateSpelling(
            spellingUuid,
            spelling,
            trx
          );
          await LoggingEditsDao.logEdit(
            'UPDATE',
            req.user!.uuid,
            'dictionary_spelling',
            spellingUuid,
            trx
          );
        }

        await Promise.all(
          discourseUuids.map(discourseUuid =>
            LoggingEditsDao.logEdit(
              'UPDATE',
              req.user!.uuid,
              'text_discourse',
              discourseUuid,
              trx
            )
          )
        );
        await Promise.all(
          discourseUuids.map(discourseUuid =>
            TextDiscourseDao.updateSpellingUuid(
              discourseUuid,
              spellingUuid,
              trx
            )
          )
        );
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .delete(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');

      await TextDiscourseDao.unsetSpellingUuid(uuid, async trx => {
        await DictionarySpellingDao.deleteSpelling(uuid, trx);

        const discourseRowUuids = await TextDiscourseDao.uuidsBySpellingUuid(
          uuid,
          trx
        );
        await Promise.all(
          discourseRowUuids.map(rowUuid =>
            LoggingEditsDao.logEdit(
              'UPDATE',
              req.user!.uuid,
              'text_discourse',
              rowUuid,
              trx
            )
          )
        );
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/dictionary/textDiscourse/:discourseUuid')
  .get(async (req, res, next) => {
    try {
      const { discourseUuid } = req.params;
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');

      const textDiscourseExists = await TextDiscourseDao.textDiscourseExists(
        discourseUuid
      );
      if (!textDiscourseExists) {
        next(
          new HttpBadRequest(
            `Cannot retrieve information on the text discourse with UUID ${discourseUuid}`
          )
        );
        return;
      }

      const spellingUuids = await TextDiscourseDao.getSpellingUuidsByDiscourseUuid(
        discourseUuid
      );

      let result: Word | null = null;

      if (spellingUuids.length > 0) {
        // Should only ever be one spelling associated with a "word" type in the text discourse table.
        const formUuid = await DictionarySpellingDao.getFormUuidBySpellingUuid(
          spellingUuids[0]
        );

        const wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
          formUuid
        );

        const grammarInfo = await DictionaryWordDao.getGrammaticalInfo(
          wordUuid
        );
        const forms = await DictionaryFormDao.getWordForms(wordUuid);

        // Only get the one form from the formUuid (keep all spellings of the form)
        const selectedForms = forms.filter(form => form.uuid === formUuid);

        result = {
          ...grammarInfo,
          forms: selectedForms,
        };
      }

      res.json(result);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
