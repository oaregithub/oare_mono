import express from 'express';
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
  UpdateFormPayload,
  AddWordPayload,
  ItemPropertyRow,
  AddWordCheckPayload,
  TextOccurrencesCountResponseItem,
  DictionaryWordTranslation,
} from '@oare/types';
import {
  tokenizeExplicitSpelling,
  normalizeSign,
  convertAppliedPropsToItemProps,
} from '@oare/oare';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import { dictionaryWordFilter } from '@/cache/filters';

const router = express.Router();

// FIXME - coming back to dictionary

router
  .route('/dictionary/spellings')
  .post(permissionsRoute('ADD_SPELLING'), async (req, res, next) => {
    try {
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const {
        formUuid,
        spelling: untrimmedSpelling,
        discourseUuids,
      }: AddFormSpellingPayload = req.body;

      const spelling = untrimmedSpelling.trim();

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

      const wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
        formUuid
      );

      const dictionaryRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        wordUuid
      );

      const dictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        dictionaryRow.word,
        dictionaryRow.type
      );

      await cache.clear(dictionaryCacheRouteToClear, { level: 'exact' });
      await cache.clear(`/dictionary/${wordUuid}`, { level: 'exact' });

      const response: AddFormSpellingResponse = { uuid: spellingUuid };
      res.status(201).json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/dictionary/spellings/check').get(async (req, res, next) => {
  try {
    const spelling = req.query.spelling as string;

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
      signs.map(token =>
        SignReadingDao.isValidReading(normalizeSign(token.tokenText))
      )
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
  .get(cacheMiddleware<Word>(dictionaryWordFilter), async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;

      const grammarInfo = await DictionaryWordDao.getGrammaticalInfo(uuid);
      const forms = await DictionaryFormDao.getWordForms(uuid, true);

      const result: Word = {
        ...grammarInfo,
        forms,
      };

      const response = await cache.insert<Word>(
        { req },
        result,
        dictionaryWordFilter
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(permissionsRoute('UPDATE_WORD_SPELLING'), async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const { word }: UpdateDictionaryWordPayload = req.body;
      const userUuid = req.user!.uuid;

      const originalDictionaryRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        uuid
      );

      await utils.createTransaction(async trx => {
        await DictionaryWordDao.updateWordSpelling(uuid, word, trx);
      });

      const originalDictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        originalDictionaryRow.word,
        originalDictionaryRow.type
      );
      const newDictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        word,
        originalDictionaryRow.type
      );

      // Updated word, cache must be cleared
      await cache.clear(originalDictionaryCacheRouteToClear, {
        level: 'exact',
      });
      await cache.clear(newDictionaryCacheRouteToClear, { level: 'exact' });
      await cache.clear(`/dictionary/${uuid}`, { level: 'exact' });
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/translations/:uuid')
  .get(async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const { uuid } = req.params;
      const response: DictionaryWordTranslation[] = await DictionaryWordDao.getWordTranslationsForDefinition(
        uuid
      );
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(permissionsRoute('UPDATE_TRANSLATION'), async (req, res, next) => {
    try {
      const cache = sl.get('cache');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const {
        translations,
        fieldType,
      }: UpdateDictionaryTranslationPayload = req.body;

      await utils.createTransaction(async trx => {
        await DictionaryWordDao.updateTranslations(
          uuid,
          translations,
          fieldType,
          trx
        );
      });

      const dictionaryRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        uuid
      );

      const dictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        dictionaryRow.word,
        dictionaryRow.type
      );

      // Updated word, cache must be cleared
      await cache.clear(dictionaryCacheRouteToClear, {
        level: 'exact',
      });
      await cache.clear(`/dictionary/${uuid}`, { level: 'exact' });
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
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const utils = sl.get('utils');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const cache = sl.get('cache');

      const { uuid: formUuid } = req.params;
      const { newForm }: UpdateFormPayload = req.body;
      const userUuid = req.user!.uuid;

      await utils.createTransaction(async trx => {
        await DictionaryFormDao.updateForm(formUuid, newForm, trx);
      });

      const wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
        formUuid
      );
      const dictionaryRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        wordUuid
      );

      const dictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        dictionaryRow.word,
        dictionaryRow.type
      );

      await cache.clear(dictionaryCacheRouteToClear, { level: 'exact' });
      await cache.clear(`/dictionary/${wordUuid}`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/spellings/occurrences/count')
  .post(async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const CollectionTextUtils = sl.get('CollectionTextUtils');
      const utils = sl.get('utils');

      const spellingUuids: string[] = req.body;
      const userUuid = req.user ? req.user.uuid : null;
      const { filter } = utils.extractPagination(req.query);

      const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

      const spellingOccurrencesCount = await Promise.all(
        spellingUuids.map(spellingUuid =>
          TextDiscourseDao.getSpellingOccurrencesCount(
            spellingUuid,
            textsToHide,
            { filter }
          )
        )
      );

      const response: TextOccurrencesCountResponseItem[] = spellingUuids.map(
        (uuid, idx) => ({
          uuid,
          count: spellingOccurrencesCount[idx],
        })
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/spellings/occurrences/texts')
  .get(async (req, res, next) => {
    try {
      const utils = sl.get('utils');
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const userUuid = req.user ? req.user.uuid : null;
      const pagination = utils.extractPagination(req.query);
      const spellingUuids = req.query.spellingUuids as string[];

      const rows = await TextDiscourseDao.getSpellingOccurrencesTexts(
        spellingUuids,
        userUuid,
        pagination
      );

      const response = await utils.getTextOccurrences(rows, req.locale);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/disconnect/spellings')
  .patch(permissionsRoute('DISCONNECT_OCCURRENCES'), async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const cache = sl.get('cache');
      const { discourseUuids }: { discourseUuids: string[] } = req.body;

      await Promise.all(
        discourseUuids.map(uuid => TextDiscourseDao.disconnectSpelling(uuid))
      );

      const discourseRows = await Promise.all(
        discourseUuids.map(uuid => TextDiscourseDao.getDiscourseRowByUuid(uuid))
      );

      await Promise.all(
        discourseRows.map(row =>
          cache.clear(`/text_epigraphies/text/${row.textUuid}`, {
            level: 'startsWith',
          })
        )
      );
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/connect/spellings')
  .patch(permissionsRoute('CONNECT_SPELLING'), async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const cache = sl.get('cache');
      const { discourseUuid, spellingUuid } = req.body;

      await TextDiscourseDao.updateSpellingUuid(discourseUuid, spellingUuid);
      const formUuid = await DictionarySpellingDao.getFormUuidBySpellingUuid(
        spellingUuid
      );
      const wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
        formUuid
      );
      await cache.clear(`/dictionary/${wordUuid}`, { level: 'exact' });
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary/spellings/:uuid')
  // FIXME replace with PATCH
  .put(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const { uuid: spellingUuid } = req.params;
      const { spelling, discourseUuids }: UpdateFormSpellingPayload = req.body;
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');

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
        }

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

      const formUuid = await DictionarySpellingDao.getFormUuidBySpellingUuid(
        spellingUuid
      );
      const wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
        formUuid
      );

      await cache.clear(`/dictionary/${wordUuid}`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .delete(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');

      const formUuid = await DictionarySpellingDao.getFormUuidBySpellingUuid(
        uuid
      );
      const wordUuid = await DictionaryFormDao.getDictionaryWordUuidByFormUuid(
        formUuid
      );

      const dictionaryRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        wordUuid
      );

      await utils.createTransaction(async trx => {
        await TextDiscourseDao.unsetSpellingUuid(uuid, trx);
        await DictionarySpellingDao.deleteSpelling(uuid, trx);
      });

      const dictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        dictionaryRow.word,
        dictionaryRow.type
      );

      await cache.clear(dictionaryCacheRouteToClear, { level: 'exact' });
      await cache.clear(`/dictionary/${wordUuid}`, { level: 'exact' });

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
      const forms = await DictionaryFormDao.getWordForms(wordUuid, true);

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
        const forms = await DictionaryFormDao.getWordForms(wordUuid, true);

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

router
  .route('/dictionary/addform')
  .post(permissionsRoute('ADD_FORM'), async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');

      const { wordUuid, formSpelling, properties }: AddFormPayload = req.body;

      await utils.createTransaction(async trx => {
        const newFormUuid = await DictionaryFormDao.addForm(
          wordUuid,
          formSpelling,
          trx
        );

        const itemPropertyRows = convertAppliedPropsToItemProps(
          properties,
          newFormUuid
        );

        await ItemPropertiesDao.insertItemPropertyRows(itemPropertyRows, trx);
      });

      const dictionaryRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        wordUuid
      );

      const dictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        dictionaryRow.word,
        dictionaryRow.type
      );

      await cache.clear(dictionaryCacheRouteToClear, { level: 'exact' });
      await cache.clear(`/dictionary/${wordUuid}`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/dictionary/checknewword').post(async (req, res, next) => {
  try {
    const DictionaryWordDao = sl.get('DictionaryWordDao');

    const { wordSpelling, properties }: AddWordCheckPayload = req.body;

    const firstLetter = wordSpelling.charAt(0);

    const wordsToCompare = await DictionaryWordDao.getWords(
      'word',
      firstLetter.toLowerCase()
    );

    const wordsSameSpelling = wordsToCompare.filter(
      word => word.word === wordSpelling
    );

    const hasMatchingProperty = (
      comparison: ItemPropertyRow[],
      property: ItemPropertyRow
    ) =>
      comparison.some(
        prop =>
          prop.variableUuid === property.variableUuid &&
          prop.valueUuid === property.valueUuid &&
          prop.level === property.level
      );
    const newWordProperties = convertAppliedPropsToItemProps(properties, '');

    if (
      wordsSameSpelling.some(
        existing =>
          existing.properties.length === newWordProperties.length &&
          existing.properties.every(prop =>
            hasMatchingProperty(newWordProperties, prop)
          )
      )
    ) {
      res.status(200).json(true);
    } else {
      res.status(200).json(false);
    }
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/dictionary/addword')
  .post(permissionsRoute('ADD_LEMMA'), async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');

      const { wordSpelling, wordType, properties }: AddWordPayload = req.body;

      let newWordUuid: string = '';

      await utils.createTransaction(async trx => {
        newWordUuid = await DictionaryWordDao.addWord(
          wordSpelling,
          wordType,
          trx
        );

        const itemPropertyRows = convertAppliedPropsToItemProps(
          properties,
          newWordUuid
        );

        await ItemPropertiesDao.insertItemPropertyRows(itemPropertyRows, trx);
      });

      const dictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
        wordSpelling,
        wordType
      );

      await cache.clear(dictionaryCacheRouteToClear, { level: 'exact' });

      res.status(201).json(newWordUuid);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
