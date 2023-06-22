import express from 'express';
import {
  EditPropertiesPayload,
  ItemProperty,
  TaxonomyPropertyTree,
  LinkPropertiesSearchPayload,
  LinkItem,
  TextDiscourseUnit,
} from '@oare/types';
import { convertAppliedPropsToItemProps } from '@oare/oare';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import _ from 'lodash';

// COMPLETE

const router = express.Router();

router
  .route('/properties/:referenceUuid')
  .get(async (req, res, next) => {
    try {
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');

      const { referenceUuid } = req.params;

      const response: ItemProperty[] = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
        referenceUuid
      );
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .patch(permissionsRoute('EDIT_ITEM_PROPERTIES'), async (req, res, next) => {
    try {
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');

      const { referenceUuid } = req.params;
      const { properties }: EditPropertiesPayload = req.body;

      await utils.createTransaction(async trx => {
        await ItemPropertiesDao.deleteItemPropertyRowsByReferenceUuid(
          referenceUuid,
          trx
        );

        const itemPropertyRows = convertAppliedPropsToItemProps(
          properties,
          referenceUuid
        );

        await ItemPropertiesDao.insertItemPropertyRows(itemPropertyRows, trx);
      });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/properties_taxonomy_tree')
  .get(cacheMiddleware<TaxonomyPropertyTree>(null), async (req, res, next) => {
    try {
      const HierarchyDao = sl.get('HierarchyDao');
      const cache = sl.get('cache');

      const tree = await HierarchyDao.createPropertiesTaxonomyTree();

      const response = await cache.insert({ req }, tree, null);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/properties_links').get(async (req, res, next) => {
  try {
    const {
      tableReference,
      search,
      textUuidFilter,
    } = (req.query as unknown) as LinkPropertiesSearchPayload;

    if (tableReference === 'dictionary_word') {
      const DictionaryWordDao = sl.get('DictionaryWordDao');

      const rows = await DictionaryWordDao.searchDictionaryWordsLinkProperties(
        search
      );

      const response: LinkItem[] = rows.map(row => ({
        objectUuid: row.uuid,
        objectDisplay: row.word,
        objectDropdownDisplay: `<span>${row.word} <b>(${row.type})</b></span>`,
      }));

      res.json(response);
      return;
    }

    if (tableReference === 'asset') {
      const AssetDao = sl.get('AssetDao');

      const response = await AssetDao.searchAssetsLinkProperties(search);

      res.json(response);
      return;
    }

    if (tableReference === 'concept?') {
      const ConceptDao = sl.get('ConceptDao');

      const response = await ConceptDao.searchConceptsLinkProperties(search);

      res.json(response);
      return;
    }

    if (tableReference === 'event') {
      const EventDao = sl.get('EventDao');

      const response = await EventDao.searchEventsLinkProperties(search);

      res.json(response);
      return;
    }

    if (tableReference === 'spatial_unit') {
      const SpatialUnitDao = sl.get('SpatialUnitDao');

      const response = await SpatialUnitDao.searchSpatialUnitsLinkProperties(
        search
      );

      res.json(response);
      return;
    }

    if (tableReference === 'text') {
      const TextDao = sl.get('TextDao');

      const response = await TextDao.searchTextsLinkProperties(search);

      res.json(response);
      return;
    }

    if (tableReference === 'period') {
      const PeriodsDao = sl.get('PeriodsDao');

      const response = await PeriodsDao.searchPeriodsLinkProperties(search);

      res.json(response);
      return;
    }

    if (tableReference === 'person') {
      const PersonDao = sl.get('PersonDao');

      const response = await PersonDao.searchPersonsLinkProperties(search);

      res.json(response);
      return;
    }

    if (tableReference === 'text_discourse') {
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      if (!textUuidFilter) {
        throw new Error(
          'Text UUID Filter is required for text discourse links'
        );
      }

      const rows = await TextDiscourseDao.searchDiscourseLinkProperties(
        search,
        textUuidFilter
      );

      // FIXME this is probably duplicated and could be extracted
      const discourseReading = (discourse: TextDiscourseUnit) => {
        let reading: string = '';
        if (
          (discourse.type === 'discourseUnit' ||
            discourse.type === 'sentence') &&
          discourse.translations.length > 0
        ) {
          reading = discourse.translations[0].field;
        } else if (
          discourse.type === 'paragraph' &&
          discourse.paragraphLabels.length > 0
        ) {
          reading = `<strong><em>${discourse.paragraphLabels[0]}</em></strong>`;
        } else if (
          (discourse.type === 'clause' || discourse.type === 'phrase') &&
          discourse.paragraphLabels.length > 0
        ) {
          reading = `<em>${discourse.paragraphLabels[0]}</em>`;
        } else if (
          (discourse.type === 'word' || discourse.type === 'number') &&
          discourse.transcription &&
          discourse.explicitSpelling
        ) {
          reading = `${discourse.transcription} (${discourse.explicitSpelling})`;
        } else if (discourse.explicitSpelling) {
          reading = discourse.explicitSpelling;
        }

        return reading || '';
      };

      const response: LinkItem[] = rows.map(row => {
        const line = row.epigraphy.line
          ? `<b> - Line ${row.epigraphy.line}</b>`
          : '';
        return {
          objectUuid: row.uuid,
          objectDisplay: discourseReading(row),
          objectDropdownDisplay: `<b>${_.capitalize(
            row.type
          )} - </b><span>${discourseReading(row)}${line}</span>`,
        };
      });

      res.json(response);
      return;
    }

    if (tableReference === 'bibliography') {
      const BibliographyDao = sl.get('BibliographyDao');

      const response = await BibliographyDao.searchBibliographiesLinkProperties(
        search
      );

      res.json(response);
      return;
    }

    res.json([]);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
