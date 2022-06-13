import express from 'express';
import { InsertItemPropertyRow, ParseTreeProperty } from '@oare/types';
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

      const { referenceUuid } = req.params;
      const { properties }: { properties: ParseTreeProperty[] } = req.body;

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

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
