import { dictionaryFilter, dictionaryWordFilter } from '@/cache/filters';
import cacheMiddleware from '@/middlewares/router/cache';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import {
  AddWordPayload,
  DictionaryWord,
  DictionaryWordTypes,
  UpdateWordSpellingPayload,
} from '@oare/types';
import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { v4 } from 'uuid';
import {
  AkkadianLetterGroupsUpper,
  convertAppliedPropsToItemProps,
} from '@oare/oare';

// COMPLETE

const router = express.Router();

router
  .route('/dictionary_word/:letter/:type')
  .get(
    permissionsRoute('WORDS'),
    cacheMiddleware<DictionaryWord[]>(dictionaryFilter),
    async (req, res, next) => {
      try {
        const cache = sl.get('cache');
        const DictionaryWordDao = sl.get('DictionaryWordDao');

        const { letter } = req.params;
        const type = req.params.type as DictionaryWordTypes;

        const wordUuids = await DictionaryWordDao.getDictionaryWordUuidsByTypeAndLetter(
          type,
          letter.toLowerCase()
        );

        const words = await Promise.all(
          wordUuids.map(uuid => DictionaryWordDao.getDictionaryWordByUuid(uuid))
        );

        const response = await cache.insert<DictionaryWord[]>(
          { req },
          words,
          dictionaryFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/dictionary_word/:uuid')
  .get(
    cacheMiddleware<DictionaryWord>(dictionaryWordFilter),
    async (req, res, next) => {
      try {
        const DictionaryWordDao = sl.get('DictionaryWordDao');
        const cache = sl.get('cache');

        const { uuid } = req.params;

        const word = await DictionaryWordDao.getDictionaryWordByUuid(uuid);

        const response = await cache.insert<DictionaryWord>(
          { req },
          word,
          dictionaryWordFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  )
  .patch(permissionsRoute('UPDATE_WORD_SPELLING'), async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;
      const { word }: UpdateWordSpellingPayload = req.body;

      const originalDictionaryWordRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        uuid
      );

      await DictionaryWordDao.updateWordSpelling(uuid, word);

      const originalLetterGroup = Object.keys(
        AkkadianLetterGroupsUpper
      ).find(key =>
        AkkadianLetterGroupsUpper[key].includes(
          originalDictionaryWordRow.word.charAt(0).toUpperCase()
        )
      );
      const newLetterGroup = Object.keys(AkkadianLetterGroupsUpper).find(key =>
        AkkadianLetterGroupsUpper[key].includes(word.charAt(0).toUpperCase())
      );
      await cache.clear(
        `/dictionary_word/${originalLetterGroup}/${originalDictionaryWordRow.type}`,
        { level: 'exact' }
      );
      await cache.clear(
        `/dictionary_word/${newLetterGroup}/${originalDictionaryWordRow.type}`,
        { level: 'exact' }
      );
      await cache.clear(`/dictionary_word/${uuid}`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary_word')
  .post(permissionsRoute('ADD_LEMMA'), async (req, res, next) => {
    try {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { wordSpelling, properties, type }: AddWordPayload = req.body;

      const uuid = v4();

      await utils.createTransaction(async trx => {
        await DictionaryWordDao.addWord(uuid, wordSpelling, type, trx);

        const itemProperties = convertAppliedPropsToItemProps(properties, uuid);

        await ItemPropertiesDao.insertItemPropertyRows(itemProperties, trx);
      });

      const letterGroup = Object.keys(AkkadianLetterGroupsUpper).find(key =>
        AkkadianLetterGroupsUpper[key].includes(
          wordSpelling.charAt(0).toUpperCase()
        )
      );
      await cache.clear(`/dictionary_word/${letterGroup}/${type}`, {
        level: 'exact',
      });

      res.status(201).json(uuid);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/dictionary_word/check').post(async (req, res, next) => {
  try {
    const DictionaryWordDao = sl.get('DictionaryWordDao');

    const { wordSpelling, properties, type }: AddWordPayload = req.body;

    const wordUuidsWithSameSpelling = await DictionaryWordDao.getDictionaryWordUuidsByTypeAndWord(
      type,
      wordSpelling
    );

    const wordsWithSameSpelling = await Promise.all(
      wordUuidsWithSameSpelling.map(uuid =>
        DictionaryWordDao.getDictionaryWordByUuid(uuid)
      )
    );

    const newWordItemProperties = convertAppliedPropsToItemProps(
      properties,
      ''
    );

    if (
      wordsWithSameSpelling.some(
        existing =>
          existing.properties.length === newWordItemProperties.length &&
          existing.properties.every(prop =>
            newWordItemProperties.some(
              p =>
                p.variableUuid === prop.variableUuid &&
                p.valueUuid === prop.valueUuid &&
                p.level === prop.level &&
                p.objectUuid === prop.objectUuid
            )
          )
      )
    ) {
      res.status(409).end();
    }

    res.status(200).end();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
