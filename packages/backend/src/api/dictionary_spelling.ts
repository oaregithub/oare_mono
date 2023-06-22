import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import {
  AddSpellingPayload,
  CheckSpellingResponse,
  ConnectSpellingPayload,
  DisconnectSpellingPayload,
  TextOccurrencesCountResponseItem,
  Token,
  UpdateSpellingPayload,
} from '@oare/types';
import express from 'express';
import sl from '@/serviceLocator';
import { v4 } from 'uuid';
import {
  tokenizeExplicitSpelling,
  normalizeSign,
  AkkadianLetterGroupsUpper,
} from '@oare/oare';

// COMPLETE

const router = express.Router();

router
  .route('/dictionary_spelling')
  .post(permissionsRoute('ADD_SPELLING'), async (req, res, next) => {
    try {
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const {
        formUuid,
        spelling: untrimmedSpelling,
        discourseUuids,
      }: AddSpellingPayload = req.body;

      const spelling = untrimmedSpelling.trim();

      const spellingAlreadyExists = await DictionarySpellingDao.spellingExistsOnForm(
        formUuid,
        spelling
      );

      if (spellingAlreadyExists) {
        next(new HttpBadRequest('Spelling already exists on form'));
        return;
      }

      const uuid = v4();

      await utils.createTransaction(async trx => {
        await DictionarySpellingDao.addSpelling(uuid, formUuid, spelling, trx);

        await Promise.all(
          discourseUuids.map(discourseUuid =>
            TextDiscourseDao.updateSpellingUuid(discourseUuid, uuid, trx)
          )
        );
      });

      const dictionaryFormRow = await DictionaryFormDao.getDictionaryFormRowByUuid(
        formUuid
      );
      const dictionaryWordRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        dictionaryFormRow.referenceUuid
      );
      await cache.clear(`/dictionary_word/${dictionaryWordRow.uuid}`, {
        level: 'exact',
      });
      const letterGroup = Object.keys(AkkadianLetterGroupsUpper).find(key =>
        AkkadianLetterGroupsUpper[key].includes(
          dictionaryWordRow.word.charAt(0).toUpperCase()
        )
      );
      await cache.clear(
        `/dictionary_word/${letterGroup}/${dictionaryWordRow.type}`,
        { level: 'exact' }
      );

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/dictionary_spelling/check').get(async (req, res, next) => {
  try {
    const SignReadingDao = sl.get('SignReadingDao');

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

    const signs = tokens.filter(({ tokenType }) => tokenType === 'SIGN');

    const signExistences = await Promise.all(
      signs.map(token =>
        SignReadingDao.isValidReading(normalizeSign(token.tokenText))
      )
    );

    if (signExistences.every(sign => sign === true)) {
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
  .route('/dictionary_spelling/occurrences/count')
  .get(async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const CollectionTextUtils = sl.get('CollectionTextUtils');
      const utils = sl.get('utils');

      const userUuid = req.user ? req.user.uuid : null;
      const spellingUuids = req.query.spellingUuids as string[];
      const { filter } = utils.extractPagination(req.query);

      const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

      const spellingOccurrencesCounts = await Promise.all(
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
          count: spellingOccurrencesCounts[idx],
        })
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary_spelling/occurrences/texts')
  .get(async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const utils = sl.get('utils');

      const userUuid = req.user ? req.user.uuid : null;
      const spellingUuids = req.query.spellingUuids as string[];
      const pagination = utils.extractPagination(req.query);

      // FIXME should make this dao function take the textsToHide array rather than computing it within
      // would bring it in line with the count function
      const occurrences = await TextDiscourseDao.getSpellingOccurrencesTexts(
        spellingUuids,
        userUuid,
        pagination
      );

      const response = await utils.getTextOccurrences(occurrences, req.locale);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary_spelling/disconnect')
  .patch(permissionsRoute('DISCONNECT_OCCURRENCES'), async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { discourseUuids }: DisconnectSpellingPayload = req.body;

      await utils.createTransaction(async trx => {
        await Promise.all(
          discourseUuids.map(uuid =>
            TextDiscourseDao.unsetSpellingUuid(uuid, trx)
          )
        );
      });

      const discourseRows = await Promise.all(
        discourseUuids.map(uuid =>
          TextDiscourseDao.getTextDiscourseRowByUuid(uuid)
        )
      );
      const uniqueTextUuids = [
        ...new Set(discourseRows.map(row => row.textUuid)),
      ];
      await Promise.all(
        uniqueTextUuids.map(textUuid =>
          cache.clear(`/epigraphies/${textUuid}`, { level: 'startsWith' })
        )
      );

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary_spelling/connect')
  .patch(permissionsRoute('CONNECT_SPELLING'), async (req, res, next) => {
    try {
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const cache = sl.get('cache');

      const { discourseUuid, spellingUuid }: ConnectSpellingPayload = req.body;

      await TextDiscourseDao.updateSpellingUuid(discourseUuid, spellingUuid);

      const dictionarySpellingRow = await DictionarySpellingDao.getDictionarySpellingRowByUuid(
        spellingUuid
      );
      const dictionaryFormRow = await DictionaryFormDao.getDictionaryFormRowByUuid(
        dictionarySpellingRow.referenceUuid
      );
      const dictionaryWordRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        dictionaryFormRow.referenceUuid
      );
      await cache.clear(`/dictionary_word/${dictionaryWordRow.uuid}`, {
        level: 'exact',
      });
      const letterGroup = Object.keys(AkkadianLetterGroupsUpper).find(key =>
        AkkadianLetterGroupsUpper[key].includes(
          dictionaryWordRow.word.charAt(0).toUpperCase()
        )
      );
      await cache.clear(
        `/dictionary_word/${letterGroup}/${dictionaryWordRow.type}`,
        { level: 'exact' }
      );

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary_spelling/:uuid')
  .patch(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const { spelling, discourseUuids }: UpdateSpellingPayload = req.body;

      const currentSpelling = await DictionarySpellingDao.getDictionarySpellingRowByUuid(
        uuid
      );

      const discourseHasSpelling = await TextDiscourseDao.hasSpelling(uuid);

      if (
        currentSpelling.explicitSpelling !== spelling &&
        discourseHasSpelling
      ) {
        next(
          new HttpBadRequest(
            'Updating a spelling that exists in text_discourse is currently not supported.'
          )
        );
        return;
      }

      await utils.createTransaction(async trx => {
        if (currentSpelling.explicitSpelling !== spelling) {
          await DictionarySpellingDao.updateSpelling(uuid, spelling, trx);
        }

        await Promise.all(
          discourseUuids.map(discourseUuid =>
            TextDiscourseDao.updateSpellingUuid(discourseUuid, uuid, trx)
          )
        );
      });

      const dictionaryFormRow = await DictionaryFormDao.getDictionaryFormRowByUuid(
        currentSpelling.referenceUuid
      );
      await cache.clear(`/dictionary_word/${dictionaryFormRow.referenceUuid}`, {
        level: 'exact',
      });
      const dictionaryWordRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        dictionaryFormRow.referenceUuid
      );
      const letterGroup = Object.keys(AkkadianLetterGroupsUpper).find(key =>
        AkkadianLetterGroupsUpper[key].includes(
          dictionaryWordRow.word.charAt(0).toUpperCase()
        )
      );
      await cache.clear(
        `/dictionary_word/${letterGroup}/${dictionaryWordRow.type}`,
        { level: 'exact' }
      );

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .delete(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const DictionarySpellingDao = sl.get('DictionarySpellingDao');
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { uuid } = req.params;

      await utils.createTransaction(async trx => {
        await TextDiscourseDao.unsetSpellingUuid(uuid, trx);
        await DictionarySpellingDao.deleteSpelling(uuid, trx);
      });

      const dictionarySpellingRow = await DictionarySpellingDao.getDictionarySpellingRowByUuid(
        uuid
      );
      const dictionaryFormRow = await DictionaryFormDao.getDictionaryFormRowByUuid(
        dictionarySpellingRow.referenceUuid
      );
      const dictionaryWordRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        dictionaryFormRow.referenceUuid
      );
      await cache.clear(`/dictionary_word/${dictionaryWordRow.uuid}`, {
        level: 'exact',
      });
      const letterGroup = Object.keys(AkkadianLetterGroupsUpper).find(key =>
        AkkadianLetterGroupsUpper[key].includes(
          dictionaryWordRow.word.charAt(0).toUpperCase()
        )
      );
      await cache.clear(
        `/dictionary_word/${letterGroup}/${dictionaryWordRow.type}`,
        { level: 'exact' }
      );

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
