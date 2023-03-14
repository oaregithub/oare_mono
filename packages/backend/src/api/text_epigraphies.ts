import express from 'express';
import { HttpInternalError, HttpBadRequest, HttpForbidden } from '@/exceptions';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';
import {
  EpigraphyResponse,
  TranslitOption,
  UpdateTranslitStatusPayload,
  CreateTextsPayload,
  InsertItemPropertyRow,
  TextDiscourseRow,
  TextEpigraphyRow,
  ResourceRow,
  LinkRow,
  ZoteroData,
  EditTextPayload,
} from '@oare/types';
import permissionsRoute from '@/middlewares/permissionsRoute';
import authenticatedRoute from '@/middlewares/authenticatedRoute';
import cacheMiddleware from '@/middlewares/cache';
import textMiddleware from '@/middlewares/text';
import fileUpload from 'express-fileupload';
import { noFilter, textFilter } from '@/cache/filters';
import { concatLocation } from './daos/ResourceDao/utils';
import { cleanLines } from './daos/EditTextUtils/utils';

const router = express.Router();

router
  .route('/text_epigraphies/images/:uuid/:cdliNum')
  .get(async (req, res, next) => {
    try {
      const { uuid: textUuid, cdliNum } = req.params;
      const ResourceDao = sl.get('ResourceDao');
      const userUuid = req.user ? req.user.uuid : null;

      const cleanCdliNum = cdliNum && cdliNum !== 'null' ? cdliNum : null;

      const response = await ResourceDao.getImageLinksByTextUuid(
        userUuid,
        textUuid,
        cleanCdliNum
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/transliteration')
  .get(
    permissionsRoute('EDIT_TRANSLITERATION_STATUS'),
    async (_req, res, next) => {
      try {
        const TextDao = sl.get('TextDao');
        const stoplightOptions: TranslitOption[] = await TextDao.getTranslitOptions();

        res.json(stoplightOptions);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  )
  .patch(
    permissionsRoute('EDIT_TRANSLITERATION_STATUS'),
    async (req, res, next) => {
      try {
        const TextDao = sl.get('TextDao');
        const { textUuid, color }: UpdateTranslitStatusPayload = req.body;
        const cache = sl.get('cache');

        await TextDao.updateTranslitStatus(textUuid, color);

        await cache.clear(
          `/text_epigraphies/text/${textUuid}`,
          {
            level: 'startsWith',
          },
          req
        );

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/text_epigraphies/text/:uuid')
  .get(
    textMiddleware,
    cacheMiddleware<EpigraphyResponse>(textFilter),
    async (req, res, next) => {
      try {
        const { uuid: textUuid } = req.params;
        const { user } = req;

        const TextDao = sl.get('TextDao');
        const TextEpigraphyDao = sl.get('TextEpigraphyDao');
        const TextDiscourseDao = sl.get('TextDiscourseDao');
        const TextDraftsDao = sl.get('TextDraftsDao');
        const CollectionDao = sl.get('CollectionDao');
        const ItemPropertiesDao = sl.get('ItemPropertiesDao');
        const BibliographyDao = sl.get('BibliographyDao');
        const ResourceDao = sl.get('ResourceDao');
        const BibliographyUtils = sl.get('BibliographyUtils');
        const cache = sl.get('cache');

        const text = await TextDao.getTextByUuid(textUuid);

        if (!text) {
          next(
            new HttpBadRequest(
              `Text with UUID ${textUuid} does not exist`,
              true
            )
          );
          return;
        }

        const collection = await CollectionDao.getTextCollection(text.uuid);

        if (!collection) {
          next(
            new HttpBadRequest('Text does not belong to a valid collection')
          );
          return;
        }

        const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
        const cdliNum = await TextDao.getCdliNum(textUuid);
        const { color, colorMeaning } = await TextDao.getTranslitStatus(
          textUuid
        );
        const discourseUnits = await TextDiscourseDao.getTextDiscourseUnits(
          textUuid
        );
        const draft = user
          ? await TextDraftsDao.getDraftByTextUuid(user.uuid, textUuid, 'en')
          : null;

        const hasEpigraphies = await TextEpigraphyDao.hasEpigraphy(textUuid);

        const bibliographyUuids = await ItemPropertiesDao.getObjectUuidsByReferenceAndVariable(
          textUuid,
          'b3938276-173b-11ec-8b77-024de1c1cc1d'
        );

        const bibItems = await Promise.all(
          bibliographyUuids.map(bibliography =>
            BibliographyDao.getBibliographyByUuid(bibliography)
          )
        );

        const zoteroCitations = await Promise.all(
          bibItems.map(async item => {
            const cit = await BibliographyUtils.getZoteroReferences(
              item,
              'chicago-author-date',
              ['citation']
            );
            return cit && cit.citation ? cit.citation : null;
          })
        );

        const referenceLocations = await Promise.all(
          bibliographyUuids.map(uuid =>
            ResourceDao.getReferringLocationInfo(textUuid, uuid)
          )
        );

        const referenceLocationsStrings = await Promise.all(
          referenceLocations.map(location => concatLocation(location))
        );

        const fileURLs = await Promise.all(
          bibliographyUuids.map((uuid, idx) =>
            ResourceDao.getPDFUrlByBibliographyUuid(
              uuid,
              referenceLocations[idx]
            )
          )
        );

        const rawZoteroData = zoteroCitations.map((cit, idx) => ({
          citation: cit
            ? `${cit.replace(/<[span/]{4,5}>/gi, '')}${
                referenceLocationsStrings[idx]
              }`
            : null,
          links: fileURLs[idx],
        }));

        const zoteroData: ZoteroData[] = rawZoteroData
          .filter(item => item.citation !== null && item.links.fileUrl !== null)
          .map(item => ({
            citation: item.citation!,
            link: item.links.fileUrl!,
            pageLink: item.links.pageLink,
            plateLink: item.links.plateLink,
          }));

        const epigraphy: EpigraphyResponse = {
          text,
          collection,
          units,
          canWrite: false,
          cdliNum,
          color,
          colorMeaning,
          discourseUnits,
          ...(draft ? { draft } : {}),
          hasEpigraphy: hasEpigraphies,
          zoteroData,
        };

        const response = await cache.insert<EpigraphyResponse>(
          { req },
          epigraphy,
          textFilter,
          60 * 60 * 24 * 30 * 6
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/text_epigraphies/text_source/:uuid')
  .get(
    textMiddleware,
    permissionsRoute('VIEW_TEXT_FILE'),
    cacheMiddleware<string | null>(noFilter),
    async (req, res, next) => {
      try {
        const { uuid: textUuid } = req.params;
        const ResourceDao = sl.get('ResourceDao');
        const cache = sl.get('cache');

        const textSourceKey = await ResourceDao.getTextFileByTextUuid(textUuid);

        if (textSourceKey) {
          const s3 = new AWS.S3();

          const textContentRaw = (
            await s3
              .getObject({
                Bucket: 'oare-texttxt-bucket',
                Key: textSourceKey,
              })
              .promise()
          ).Body;

          const textContent = textContentRaw
            ? textContentRaw.toString('utf-8')
            : null;

          const response = await cache.insert<string | null>(
            { req },
            textContent,
            noFilter
          );

          res.json(response);
        } else {
          const response = await cache.insert<null>({ req }, null, noFilter);

          res.json(response);
        }
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/text_epigraphies/designator/:preText')
  .get(async (req, res, next) => {
    try {
      const { preText } = req.params;
      const ResourceDao = sl.get('ResourceDao');

      const currentMatches = await ResourceDao.getImageDesignatorMatches(
        preText
      );
      const matchesWithoutPretext = currentMatches.map(match =>
        match.replace(preText, '')
      );
      const matchesWithoutFileTypes = matchesWithoutPretext.map(match =>
        match.slice(0, match.indexOf('.'))
      );

      const designatorsAsNumbers = matchesWithoutFileTypes.map(
        match => Number(match) || 0
      );

      const max =
        designatorsAsNumbers.length > 0 ? Math.max(...designatorsAsNumbers) : 0;

      res.json(max + 1);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/additional_images')
  .post(permissionsRoute('UPLOAD_EPIGRAPHY_IMAGES'), async (req, res, next) => {
    try {
      const ResourceDao = sl.get('ResourceDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');

      const {
        resources,
        links,
        itemProperties,
      }: {
        resources: ResourceRow[];
        links: LinkRow[];
        itemProperties: InsertItemPropertyRow[];
      } = req.body;

      await utils.createTransaction(async trx => {
        await Promise.all(
          resources.map(row => ResourceDao.insertResourceRow(row, trx))
        );

        await Promise.all(
          links.map(row => ResourceDao.insertLinkRow(row, trx))
        );

        const itemPropertyRowLevels = [
          ...new Set(itemProperties.map(row => row.level)),
        ];
        const rowsByLevel: InsertItemPropertyRow[][] = itemPropertyRowLevels.map(
          level => itemProperties.filter(row => row.level === level)
        );
        for (let i = 0; i < rowsByLevel.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            rowsByLevel[i].map(row => ItemPropertiesDao.addProperty(row, trx))
          );
        }
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/create')
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

      const existingTextRow = await TextDao.getTextRowByUuid(tables.text.uuid);
      const addingToExistingText = !!existingTextRow;

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

        await PublicDenylistDao.addItemsToDenylist(
          [tables.text.uuid],
          'text',
          trx
        );

        // Item Properties
        const itemPropertyRowLevels = [
          ...new Set(tables.itemProperties.map(row => row.level)),
        ];
        const rowsByLevel: InsertItemPropertyRow[][] = itemPropertyRowLevels.map(
          level => tables.itemProperties.filter(row => row.level === level)
        );
        for (let i = 0; i < rowsByLevel.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            rowsByLevel[i].map(row => ItemPropertiesDao.addProperty(row, trx))
          );
        }
      });

      await cache.clear(
        `/collections/${tables.hierarchy.objectParentUuid}`,
        {
          level: 'exact',
        },
        req
      );

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/upload_image/:key')
  .post(permissionsRoute('ADD_NEW_TEXTS'), async (req, res, next) => {
    try {
      const s3 = new AWS.S3();
      const { key } = req.params;

      if (!req.files) {
        res.status(400).end();
        return;
      }

      const file = req.files.newFile as fileUpload.UploadedFile;

      const params: AWS.S3.PutObjectRequest = {
        Bucket: 'oare-image-bucket',
        Key: key,
        Body: file.data,
      };

      await s3.putObject(params).promise();

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/edit_text_info')
  .patch(permissionsRoute('EDIT_TEXT_INFO'), async (req, res, next) => {
    const TextDao = sl.get('TextDao');
    const CollectionDao = sl.get('CollectionDao');
    const cache = sl.get('cache');

    try {
      const { uuid } = req.body;
      const { excavationPrefix } = req.body;
      const { excavationNumber } = req.body;
      const { museumPrefix } = req.body;
      const { museumNumber } = req.body;
      const { publicationPrefix } = req.body;
      const { publicationNumber } = req.body;

      await TextDao.updateTextInfo(
        uuid,
        excavationPrefix,
        excavationNumber,
        museumPrefix,
        museumNumber,
        publicationPrefix,
        publicationNumber
      );

      const collectionUuid = await CollectionDao.getTextCollectionUuid(uuid);

      await cache.clear(
        `/text_epigraphies/text/${uuid}`,
        {
          level: 'startsWith',
        },
        req
      );
      await cache.clear(
        `/collections/${collectionUuid}`,
        { level: 'exact' },
        req
      );

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/text_epigraphies/resource/:tag').get(async (req, res, next) => {
  try {
    const { tag } = req.params;

    const ResourceDao = sl.get('ResourceDao');
    const resource = await ResourceDao.getDirectObjectLink(tag);

    if (resource) {
      const s3 = new AWS.S3();

      const response = await s3.getSignedUrlPromise('getObject', {
        Bucket: resource.container,
        Key: resource.link,
      });

      res.json(response);
    } else {
      res.json(null);
    }
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/text_epigraphies/has_epigraphy/:uuid')
  .get(textMiddleware, async (req, res, next) => {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    try {
      const { uuid: textUuid } = req.params;

      const hasEpigraphy = await TextEpigraphyDao.hasEpigraphy(textUuid);

      res.json(hasEpigraphy);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/seal_impression/:uuid')
  .get(permissionsRoute('ADD_SEAL_LINK'), async (req, res, next) => {
    try {
      const SealDao = sl.get('SealDao');
      const { uuid } = req.params;

      const linkedSealUuid: string | null = await SealDao.getLinkedSealUuid(
        uuid
      );

      res.json(linkedSealUuid);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/edit_text')
  .post(authenticatedRoute, async (req, res, next) => {
    try {
      const CollectionTextUtils = sl.get('CollectionTextUtils');
      const EditTextUtils = sl.get('EditTextUtils');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const userUuid = req.user!.uuid;

      const payload: EditTextPayload = req.body;

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

        await cleanLines(payload.textUuid, trx);
      });

      await cache.clear(
        `/text_epigraphies/text/${payload.textUuid}`,
        {
          level: 'startsWith',
        },
        req
      );

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
