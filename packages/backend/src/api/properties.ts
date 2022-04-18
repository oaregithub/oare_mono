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

      const { referenceUuid } = req.params;
      const { properties }: { properties: ParseTreeProperty[] } = req.body;

      await ItemPropertiesDao.deletePropertiesByReferenceUuid(referenceUuid);

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
          rowsByLevel[i].map(row => ItemPropertiesDao.addProperty(row))
        );
      }

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/properties/verify_source').get(async (req, res, next) => {
  try {
    const UuidDao = sl.get('UuidDao');

    const uuids = (req.query.uuids as unknown) as string[];
    const haveSameTableReference = await UuidDao.haveSameTableReference(uuids);

    res.json(haveSameTableReference);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
