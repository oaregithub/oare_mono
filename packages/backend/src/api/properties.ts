import express from 'express';
import {
  EditPropertiesPayload,
  ItemPropertyRow,
  TaxonomyPropertyTree,
  LinkPropertiesSearchPayload,
  LinkItem,
  DiscourseUnit,
  BibliographyResponse,
} from '@oare/types';
import { convertAppliedPropsToItemProps } from '@oare/oare';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import cacheMiddleware from '@/middlewares/cache';
import { noFilter } from '@/cache/filters';
import { capitalize } from 'lodash';
import axios from 'axios';
import { API_PATH } from '@/setupRoutes';

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
      textUuidFilter,
    } = (req.query as unknown) as LinkPropertiesSearchPayload;

    if (tableReference === 'dictionary_word') {
      const DictionaryWordDao = sl.get('DictionaryWordDao');
      const rows = await DictionaryWordDao.searchDictionaryWords(search);
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

    if (tableReference === 'text_discourse') {
      if (!textUuidFilter) {
        throw new Error(
          'Text UUID Filter is required for text discourse links'
        );
      }
      const TextDiscourseDao = sl.get('TextDiscourseDao');

      const rows = await TextDiscourseDao.searchDiscourse(
        search,
        textUuidFilter
      );

      const discourseReading = (discourse: DiscourseUnit) => {
        let reading;
        if (
          (discourse.type === 'discourseUnit' ||
            discourse.type === 'sentence') &&
          discourse.translation
        ) {
          reading = discourse.translation;
        } else if (discourse.type === 'paragraph' && discourse.paragraphLabel) {
          reading = `<strong><em>${discourse.paragraphLabel}</em></strong>`;
        } else if (
          (discourse.type === 'clause' || discourse.type === 'phrase') &&
          discourse.paragraphLabel
        ) {
          reading = `<em>${discourse.paragraphLabel}</em>`;
        } else if (
          (discourse.type === 'word' || discourse.type === 'number') &&
          discourse.transcription &&
          discourse.explicitSpelling
        ) {
          const line = discourse.line ? ` Line ${discourse.line}` : '';
          reading = `${discourse.transcription} (${discourse.explicitSpelling})`;
        } else {
          reading = discourse.explicitSpelling;
        }

        return reading || '';
      };

      const response: LinkItem[] = rows.map(row => {
        const line = row.line ? `<b> - Line ${row.line}</b>` : '';
        return {
          objectUuid: row.uuid,
          objectDisplay: discourseReading(row),
          objectDropdownDisplay: `<b>${capitalize(
            row.type
          )} - </b><span>${discourseReading(row)}${line}</span>`,
        };
      });

      res.json(response);
      return;
    }

    if (tableReference === 'bibliography') {
      const host =
        process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';
      const {
        data: bibliographies,
      }: { data: BibliographyResponse[] } = await axios.get(
        `${host}${API_PATH}/bibliographies`,
        {
          params: {
            citationStyle: 'chicago-author-date',
          },
          headers: {
            Authorization: req.headers.authorization || '',
          },
        }
      );
      const relevantBibliographies = bibliographies.filter(b => {
        if (b.title && b.title.includes(search)) {
          return true;
        }
        if (b.authors.filter(a => a.includes(search)).length > 0) {
          return true;
        }
        return false;
      });
      const response: LinkItem[] = relevantBibliographies.map(b => ({
        objectUuid: b.uuid,
        objectDisplay: `${b.authors.join(', ')} - ${b.title || ''}`,
        objectDropdownDisplay: b.bibliography.bib || undefined,
      }));
      res.json(response);
      return;
    }

    res.json([]);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
