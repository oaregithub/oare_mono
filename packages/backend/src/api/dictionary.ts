import express from 'express';
import _ from 'lodash';
import {
  Word,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  UpdateFormSpellingPayload,
  AddFormSpellingPayload,
  AddFormSpellingResponse,
  CheckSpellingResponse,
  Token,
  AddFormPayload,
  InsertItemPropertyRow,
  UpdateFormPayload,
} from '@oare/types';
import {
  tokenizeExplicitSpelling,
  normalizeSign,
  convertParsePropsToItemProps,
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
      const utils = sl.get('utils');

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

      let spellingUuid: string = '';

      await utils.createTransaction(async trx => {
        spellingUuid = await DictionarySpellingDao.addSpelling(
          formUuid,
          spelling,
          trx
        );
        await LoggingEditsDao.logEdit(
          'INSERT',
          req.user!.uuid,
          'dictionary_spelling',
          spellingUuid,
          trx
        );

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

      const response: AddFormSpellingResponse = { uuid: spellingUuid };
      res.status(201).json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
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
      if ((e as any).hash) {
        const {
          hash: {
            loc: { last_column: errorIndex },
          },
        } = e as any;

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
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/dictionary/:uuid')
  .get(async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const { uuid } = req.params;
      const isAdmin = req.user ? req.user.isAdmin : false;

      const grammarInfo = await DictionaryWordDao.getGrammaticalInfo(uuid);
      const forms = await DictionaryFormDao.getWordForms(uuid, isAdmin, true);

      const result: Word = {
        ...grammarInfo,
        forms,
      };
      res.json(result);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(permissionsRoute('UPDATE_WORD_SPELLING'), async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const { word }: UpdateDictionaryWordPayload = req.body;
      const userUuid = req.user!.uuid;

      await utils.createTransaction(async trx => {
        await LoggingEditsDao.logEdit(
          'UPDATE',
          userUuid,
          'dictionary_word',
          uuid,
          trx
        );
        await DictionaryWordDao.updateWordSpelling(uuid, word, trx);
      });

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
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/translations/:uuid')
  .patch(permissionsRoute('UPDATE_TRANSLATION'), async (req, res, next) => {
    try {
      const cache = sl.get('cache');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const { translations }: UpdateDictionaryTranslationPayload = req.body;

      await utils.createTransaction(async trx => {
        await DictionaryWordDao.updateTranslations(
          req.user!.uuid,
          uuid,
          translations,
          trx
        );
      });

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
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/forms/:uuid')
  .patch(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const utils = sl.get('utils');

      const { uuid: formUuid } = req.params;
      const { newForm }: UpdateFormPayload = req.body;
      const userUuid = req.user!.uuid;

      await utils.createTransaction(async trx => {
        await LoggingEditsDao.logEdit(
          'UPDATE',
          userUuid,
          'dictionary_form',
          formUuid,
          trx
        );
        await DictionaryFormDao.updateForm(formUuid, newForm, trx);

        const discourseUuids = await TextDiscourseDao.getDiscourseUuidsByFormUuid(
          formUuid,
          trx
        );
        await Promise.all(
          discourseUuids.map(uuid =>
            LoggingEditsDao.logEdit(
              'UPDATE',
              userUuid,
              'text_discourse',
              uuid,
              trx
            )
          )
        );
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/spellings/spelling_occurrences/occurrences')
  .get(async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const utils = sl.get('utils');
      const { filter } = utils.extractPagination(req.query);
      const uuids = (req.query.spellingUuids as unknown) as string[];
      const userUuid = req.user ? req.user.uuid : null;
      const totalOccurrences = await TextDiscourseDao.getTotalSpellingTexts(
        uuids,
        userUuid,
        { filter }
      );

      res.json(totalOccurrences);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/spelling_occurrences/texts')
  .get(async (req, res, next) => {
    try {
      const utils = sl.get('utils');
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const userUuid = req.user ? req.user.uuid : null;
      const pagination = utils.extractPagination(req.query);
      const spellingUuids = (req.query.spellingUuids as unknown) as string[];

      const rows = await TextDiscourseDao.getSpellingTextOccurrences(
        spellingUuids,
        userUuid,
        pagination
      );

      const response = await utils.getTextOccurrences(rows);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/disconnect/spellings')
  .patch(permissionsRoute('DISCONNECT_SPELLING'), async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const { discourseUuids } = req.body;

      await TextDiscourseDao.disconnectSpellings(discourseUuids);
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
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
      next(new HttpInternalError(err as string));
    }
  })
  .delete(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const utils = sl.get('utils');

      await utils.createTransaction(async trx => {
        await TextDiscourseDao.unsetSpellingUuid(uuid, trx);
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
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/textDiscourse/spelling/:spellingUuid')
  .get(async (req, res, next) => {
    try {
      const { spellingUuid } = req.params;
      const isAdmin = req.user ? req.user.isAdmin : false;
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');

      let result: Word | null = null;

      const formUuid = await DictionarySpellingDao.getFormUuidBySpellingUuid(
        spellingUuid
      );

      const wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
        formUuid
      );

      const grammarInfo = await DictionaryWordDao.getGrammaticalInfo(wordUuid);
      const forms = await DictionaryFormDao.getWordForms(
        wordUuid,
        isAdmin,
        true
      );

      // Only get the one form from the formUuid (keep all spellings of the form)
      const selectedForms = forms.filter(form => form.uuid === formUuid);

      result = {
        ...grammarInfo,
        forms: selectedForms,
      };

      res.json(result);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/textDiscourse/discourse/:discourseUuid')
  .get(async (req, res, next) => {
    try {
      const { discourseUuid } = req.params;
      const isAdmin = req.user ? req.user.isAdmin : false;
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
        const forms = await DictionaryFormDao.getWordForms(
          wordUuid,
          isAdmin,
          true
        );

        // Only get the one form from the formUuid (keep all spellings of the form)
        const selectedForms = forms.filter(form => form.uuid === formUuid);

        result = {
          ...grammarInfo,
          forms: selectedForms,
        };
      }

      res.json(result);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/dictionary/tree/taxonomy').get(async (req, res, next) => {
  try {
    const HierarchyDao = sl.get('HierarchyDao');
    const cache = sl.get('cache');

    const tree = await HierarchyDao.createTaxonomyTree();
    cache.insert({ req }, tree);
    res.json(tree);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/dictionary/addform')
  .post(permissionsRoute('ADD_FORM'), async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');

      const { wordUuid, formSpelling, properties }: AddFormPayload = req.body;

      await utils.createTransaction(async trx => {
        const newFormUuid = await DictionaryFormDao.addForm(
          wordUuid,
          formSpelling,
          trx
        );

        const itemPropertyRows = convertParsePropsToItemProps(
          properties,
          newFormUuid
        );

        const itemPropertyRowLevels = [
          ...new Set(itemPropertyRows.map(row => row.level)),
        ];
        const rowsByLevel: InsertItemPropertyRow[][] = itemPropertyRowLevels.map(
          level => itemPropertyRows.filter(row => row.level === level)
        );

        for (let i = 0; i < rowsByLevel.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            rowsByLevel[i].map(row => ItemPropertiesDao.addProperty(row, trx))
          );
        }
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
