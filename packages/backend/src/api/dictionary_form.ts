import permissionsRoute from '@/middlewares/router/permissionsRoute';
import { AddFormPayload, UpdateFormSpellingPayload } from '@oare/types';
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
  .route('/dictionary_form/:uuid')
  .patch(permissionsRoute('UPDATE_FORM'), async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;
      const { form }: UpdateFormSpellingPayload = req.body;

      await DictionaryFormDao.updateFormSpelling(uuid, form);

      const dictionaryFormRow = await DictionaryFormDao.getDictionaryFormRowByUuid(
        uuid
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

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dictionary_form')
  .post(permissionsRoute('ADD_FORM'), async (req, res, next) => {
    try {
      const DictionaryFormDao = sl.get('DictionaryFormDao');
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { wordUuid, formSpelling, properties }: AddFormPayload = req.body;

      await utils.createTransaction(async trx => {
        const uuid = v4();

        await DictionaryFormDao.addForm(uuid, wordUuid, formSpelling, trx);

        const itemProperties = convertAppliedPropsToItemProps(properties, uuid);

        await ItemPropertiesDao.insertItemPropertyRows(itemProperties, trx);
      });

      await cache.clear(`/dictionary_word/${wordUuid}`, {
        level: 'exact',
      });
      const dictionaryWordRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        wordUuid
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

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
