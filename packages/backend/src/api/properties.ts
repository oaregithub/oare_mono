import express from 'express';
import {
  EditPropertiesPayload,
  ItemPropertyRow,
  TaxonomyPropertyTree,
  LinkPropertiesSearchPayload,
} from '@oare/types';
import { convertAppliedPropsToItemProps } from '@oare/oare';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import cacheMiddleware from '@/middlewares/cache';
import { noFilter } from '@/cache/filters';

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

        const itemPropertyRows = convertAppliedPropsToItemProps(
          properties,
          referenceUuid
        );

        await ItemPropertiesDao.addProperties(itemPropertyRows, trx);
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

router.route('/properties/:referenceUuid').get(async (req, res, next) => {
  try {
    const { referenceUuid } = req.params;
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    const response: ItemPropertyRow[] = await ItemPropertiesDao.getPropertiesByReferenceUuid(
      referenceUuid
    );
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/properties_taxonomy_tree')
  .get(
    cacheMiddleware<TaxonomyPropertyTree>(noFilter),
    async (req, res, next) => {
      try {
        const HierarchyDao = sl.get('HierarchyDao');
        const cache = sl.get('cache');

        const tree = await HierarchyDao.createPropertiesTaxonomyTree();

        const response = await cache.insert({ req }, tree, noFilter);

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router.route('/properties_links').get(async (req, res, next) => {
  try {
    const {
      tableReference,
      search,
    } = (req.query as unknown) as LinkPropertiesSearchPayload;

    if (tableReference === 'dictionary_word') {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const response = await DictionaryWordDao.searchDictionaryWords(search);
      res.json(response);
      return;
    }

    if (tableReference === 'asset') {
      const AssetDao = sl.get('AssetDao');
      const response = await AssetDao.searchAssets(search);
      res.json(response);
      return;
    }

    if (tableReference === 'concept?') {
      const ConceptDao = sl.get('ConceptDao');
      const response = await ConceptDao.searchConcepts(search);
      res.json(response);
      return;
    }

    if (tableReference === 'event') {
      const EventDao = sl.get('EventDao');
      const response = await EventDao.searchEvents(search);
      res.json(response);
      return;
    }

    if (tableReference === 'spatial_unit') {
      const SpatialUnitDao = sl.get('SpatialUnitDao');
      const response = await SpatialUnitDao.searchSpatialUnits(search);
      res.json(response);
      return;
    }

    if (tableReference === 'text') {
      const TextDao = sl.get('TextDao');
      const response = await TextDao.searchTexts(search);
      res.json(response);
      return;
    }

    if (tableReference === 'period') {
      const PeriodsDao = sl.get('PeriodsDao');
      const response = await PeriodsDao.searchPeriods(search);
      res.json(response);
      return;
    }

    if (tableReference === 'person') {
      const PersonDao = sl.get('PersonDao');
      const response = await PersonDao.searchPersons(search);
      res.json(response);
      return;
    }

    res.json([]);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
