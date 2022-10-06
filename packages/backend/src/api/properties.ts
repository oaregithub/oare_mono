import express from 'express';
import { InsertItemPropertyRow, EditPropertiesPayload } from '@oare/types';
import { convertParsePropsToItemProps } from '@oare/oare';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/properties/edit/:referenceUuid')
  .patch(permissionsRoute('EDIT_ITEM_PROPERTIES'), async (req, res, next) => {
    try {
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');
      const DictionaryWordDao = sl.get('DictionaryWordDao');

      const { referenceUuid } = req.params;
      const { properties, wordUuid }: EditPropertiesPayload = req.body;

      await utils.createTransaction(async trx => {
        await ItemPropertiesDao.deletePropertiesByReferenceUuid(
          referenceUuid,
          trx
        );

        const itemPropertyRows = convertParsePropsToItemProps(
          properties,
          referenceUuid
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

      if (wordUuid) {
        const dictionaryRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
          wordUuid
        );

        const dictionaryCacheRouteToClear = utils.getDictionaryCacheRouteToClear(
          dictionaryRow.word,
          dictionaryRow.type
        );

        await cache.clear(dictionaryCacheRouteToClear, { level: 'exact' }, req);
        await cache.clear(`/dictionary/${wordUuid}`, { level: 'exact' }, req);
      }

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/properties/verify_source').get(async (req, res, next) => {
  try {
    const UuidDao = sl.get('UuidDao');

    const uuids = (req.query.uuids as unknown) as string[];
    const haveSameTableReference = await UuidDao.haveSameTableReference(uuids);

    res.json(haveSameTableReference);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
