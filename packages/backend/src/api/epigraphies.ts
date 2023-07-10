import express from 'express';
import { HttpInternalError, HttpBadRequest, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';
import {
  Epigraphy,
  CreateTextsPayload,
  TextDiscourseRow,
  TextEpigraphyRow,
  EditTextPayload,
} from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import authenticatedRoute from '@/middlewares/router/authenticatedRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import textMiddleware from '@/middlewares/router/text';
import { epigraphyFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/epigraphies/:uuid')
  .get(
    textMiddleware,
    cacheMiddleware<Epigraphy>(epigraphyFilter),
    async (req, res, next) => {
      try {
        const { uuid: textUuid } = req.params;

        const TextDao = sl.get('TextDao');
        const TextEpigraphyDao = sl.get('TextEpigraphyDao');
        const TextDiscourseDao = sl.get('TextDiscourseDao');
        const CollectionDao = sl.get('CollectionDao');
        const BibliographyDao = sl.get('BibliographyDao');
        const ResourceDao = sl.get('ResourceDao');
        const HierarchyDao = sl.get('HierarchyDao');
        const cache = sl.get('cache');

        const textExists = await TextDao.textExists(textUuid);
        if (!textExists) {
          next(
            new HttpBadRequest(
              `Text with UUID ${textUuid} does not exist`,
              true
            )
          );
          return;
        }

        const text = await TextDao.getTextByUuid(textUuid);

        const collection = await CollectionDao.getCollectionRowByUuid(
          text.collectionUuid
        );

        const citations = await BibliographyDao.getCitationsByTextUuid(
          textUuid
        );

        const sourceText = await ResourceDao.getTextFileByTextUuid(textUuid);

        const transliteration = await HierarchyDao.getTextTransliterationStatusByUuid(
          text.translitStatus
        );

        const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
        const discourseUnits = await TextDiscourseDao.getTextDiscourseUnits(
          textUuid
        );

        const epigraphy: Epigraphy = {
          text,
          collection,
          citations,
          sourceText,
          transliteration,
          images: [], // Will be set in cache filter
          canEdit: false, // Will be set in cache filter
          units,
          discourseUnits,
        };

        const response = await cache.insert<Epigraphy>(
          { req },
          epigraphy,
          epigraphyFilter,
          60 * 60 * 24 * 30 * 6
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  )
  .patch(authenticatedRoute, async (req, res, next) => {
    try {
      const CollectionTextUtils = sl.get('CollectionTextUtils');
      const EditTextUtils = sl.get('EditTextUtils');
      const TextDao = sl.get('TextDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const userUuid = req.user!.uuid;

      const payload: EditTextPayload = req.body;

      const textExists = await TextDao.textExists(payload.textUuid);
      if (!textExists) {
        next(
          new HttpBadRequest(
            `Text with UUID ${payload.textUuid} does not exist`
          )
        );
        return;
      }

      const canEditText = await CollectionTextUtils.canEditText(
        payload.textUuid,
        userUuid
      );
      if (!canEditText) {
        next(new HttpForbidden('You do not have permission to edit this text'));
        return;
      }

      await utils.createTransaction(async trx => {
        if (payload.type === 'addSide') {
          await EditTextUtils.addSide(payload, trx);
        } else if (payload.type === 'addColumn') {
          await EditTextUtils.addColumn(payload, trx);
        } else if (
          payload.type === 'addRegionBroken' ||
          payload.type === 'addRegionRuling' ||
          payload.type === 'addRegionSealImpression' ||
          payload.type === 'addRegionUninscribed'
        ) {
          await EditTextUtils.addRegion(payload, trx);
        } else if (payload.type === 'addLine') {
          await EditTextUtils.addLine(payload, trx);
        } else if (payload.type === 'addUndeterminedLines') {
          await EditTextUtils.addUndeterminedLines(payload, trx);
        } else if (payload.type === 'addWord') {
          await EditTextUtils.addWord(payload, trx);
        } else if (payload.type === 'addSign') {
          await EditTextUtils.addSign(payload, trx);
        } else if (payload.type === 'addUndeterminedSigns') {
          await EditTextUtils.addUndeterminedSigns(payload, trx);
        } else if (payload.type === 'addDivider') {
          await EditTextUtils.addDivider(payload, trx);
        } else if (payload.type === 'editSide') {
          await EditTextUtils.editSide(payload, trx);
        } else if (payload.type === 'editColumn') {
          await EditTextUtils.editColumn(payload, trx);
        } else if (
          payload.type === 'editRegionBroken' ||
          payload.type === 'editRegionRuling' ||
          payload.type === 'editRegionSealImpression' ||
          payload.type === 'editRegionUninscribed'
        ) {
          await EditTextUtils.editRegion(payload, trx);
        } else if (payload.type === 'editUndeterminedLines') {
          await EditTextUtils.editUndeterminedLines(payload, trx);
        } else if (payload.type === 'editSign') {
          await EditTextUtils.editSign(payload, trx);
        } else if (payload.type === 'editUndeterminedSigns') {
          await EditTextUtils.editUndeterminedSigns(payload, trx);
        } else if (payload.type === 'editDivider') {
          await EditTextUtils.editDivider(payload, trx);
        } else if (payload.type === 'splitLine') {
          await EditTextUtils.splitLine(payload, trx);
        } else if (payload.type === 'splitWord') {
          await EditTextUtils.splitWord(payload, trx);
        } else if (payload.type === 'mergeLine') {
          await EditTextUtils.mergeLines(payload, trx);
        } else if (payload.type === 'mergeWord') {
          await EditTextUtils.mergeWords(payload, trx);
        } else if (payload.type === 'reorderSign') {
          await EditTextUtils.reorderSign(payload, trx);
        } else if (payload.type === 'removeSide') {
          await EditTextUtils.removeSide(payload, trx);
        } else if (payload.type === 'removeColumn') {
          await EditTextUtils.removeColumn(payload, trx);
        } else if (
          payload.type === 'removeRegionBroken' ||
          payload.type === 'removeRegionRuling' ||
          payload.type === 'removeRegionSealImpression' ||
          payload.type === 'removeRegionUninscribed'
        ) {
          await EditTextUtils.removeRegion(payload, trx);
        } else if (payload.type === 'removeLine') {
          await EditTextUtils.removeLine(payload, trx);
        } else if (payload.type === 'removeUndeterminedLines') {
          await EditTextUtils.removeUndeterminedLines(payload, trx);
        } else if (payload.type === 'removeWord') {
          await EditTextUtils.removeWord(payload, trx);
        } else if (payload.type === 'removeDivider') {
          await EditTextUtils.removeDivider(payload, trx);
        } else if (
          payload.type === 'removeSign' ||
          payload.type === 'removeUndeterminedSigns'
        ) {
          await EditTextUtils.removeSign(payload, trx);
        }

        await EditTextUtils.cleanLines(payload.textUuid, trx);
      });

      await cache.clear(`/epigraphies/${payload.textUuid}`, {
        level: 'startsWith',
      });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/epigraphies')
  .post(permissionsRoute('ADD_NEW_TEXTS'), async (req, res, next) => {
    try {
      const TextDao = sl.get('TextDao');
      const HierarchyDao = sl.get('HierarchyDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const ResourceDao = sl.get('ResourceDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const TextMarkupDao = sl.get('TextMarkupDao');
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const TreeDao = sl.get('TreeDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');

      const { tables }: CreateTextsPayload = req.body;

      const addingToExistingText = await TextDao.textExists(tables.text.uuid);

      await utils.createTransaction(async trx => {
        // Text
        if (!addingToExistingText) {
          await TextDao.insertTextRow(tables.text, trx);
        } else {
          await TextDao.updateTextInfo(
            tables.text.uuid,
            tables.text.excavationPrefix,
            tables.text.excavationNumber,
            tables.text.museumPrefix,
            tables.text.museumNumber,
            tables.text.publicationPrefix,
            tables.text.publicationNumber,
            trx
          );
        }

        // Hierarchy
        if (!addingToExistingText) {
          await HierarchyDao.insertHierarchyRow(tables.hierarchy, trx);
        }

        // Resource
        await Promise.all(
          tables.resources.map(row => ResourceDao.insertResourceRow(row, trx))
        );

        // Link
        await Promise.all(
          tables.links.map(row => ResourceDao.insertLinkRow(row, trx))
        );

        // Tree
        await Promise.all(
          tables.trees.map(row => TreeDao.insertTreeRow(row, trx))
        );

        // Discourse
        const discourseRowParents = [
          ...new Set(tables.discourses.map(row => row.parentUuid)),
        ];
        const discourseRowsByParent: TextDiscourseRow[][] = discourseRowParents.map(
          parent => tables.discourses.filter(row => row.parentUuid === parent)
        );
        for (let i = 0; i < discourseRowsByParent.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            discourseRowsByParent[i].map(row =>
              TextDiscourseDao.insertDiscourseRow(row, trx)
            )
          );
        }

        // Epigraphy
        const epigraphyRowParents = [
          ...new Set(tables.epigraphies.map(row => row.parentUuid)),
        ];
        const epigraphyRowsByParent: TextEpigraphyRow[][] = epigraphyRowParents.map(
          parent => tables.epigraphies.filter(row => row.parentUuid === parent)
        );
        for (let i = 0; i < epigraphyRowsByParent.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            epigraphyRowsByParent[i].map(row =>
              TextEpigraphyDao.insertEpigraphyRow(row, trx)
            )
          );
        }

        // Markup
        await Promise.all(
          tables.markups.map(row => TextMarkupDao.insertMarkupRow(row, trx))
        );

        // Public Denylist
        await PublicDenylistDao.addItemsToDenylist(
          [tables.text.uuid],
          'text',
          trx
        );

        // Item Properties
        await ItemPropertiesDao.insertItemPropertyRows(
          tables.itemProperties,
          trx
        );
      });

      await cache.clear(`/collection/${tables.hierarchy.objectParentUuid}`, {
        level: 'exact',
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
