import express from 'express';
import { HttpInternalError, HttpForbidden, HttpBadRequest } from '@/exceptions';
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
} from '@oare/types';
import permissionsRoute from '@/middlewares/permissionsRoute';
import fileUpload from 'express-fileupload';
import fetch from 'node-fetch';

const router = express.Router();

router
  .route('/text_epigraphies/images/:uuid/:cdliNum')
  .get(async (req, res, next) => {
    try {
      const { uuid: textUuid, cdliNum } = req.params;
      const ResourceDao = sl.get('ResourceDao');

      const response = await ResourceDao.getImageLinksByTextUuid(
        textUuid,
        cdliNum
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

        await TextDao.updateTranslitStatus(textUuid, color);

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router.route('/text_epigraphies/text/:uuid').get(async (req, res, next) => {
  try {
    const { uuid: textUuid } = req.params;
    const { user } = req;
    const userUuid = user ? user.uuid : null;
    const TextDao = sl.get('TextDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const TextDraftsDao = sl.get('TextDraftsDao');
    const CollectionDao = sl.get('CollectionDao');
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const BibliographyDao = sl.get('BibliographyDao');
    const ResourceDao = sl.get('ResourceDao');

    const objUuids = await ItemPropertiesDao.getVariableObjectByReference(
      textUuid,
      'b3938276-173b-11ec-8b77-024de1c1cc1d'
    );

    const bibliographies = await Promise.all(
      objUuids.map(uuid => BibliographyDao.getBibliographyByUuid(uuid))
    );

    const zoteroKeys = bibliographies.map(bib => bib.zoteroKey);

    const citationStyle = 'chicago-author-date';
    let apiKey = '';

    if (process.env.ZOTERO_API_KEY) {
      apiKey = process.env.ZOTERO_API_KEY;
    } else {
      const s3 = new AWS.S3();
      const response = (
        await s3
          .getObject({
            Bucket: 'oare-resources',
            Key: 'zotero_auth.json',
          })
          .promise()
      ).Body;
      if (response) {
        apiKey = JSON.parse(response as string).authKey;
      }
    }

    const zoteroResponses = await Promise.all(
      zoteroKeys.map(zoteroKey =>
        fetch(
          `https://api.zotero.org/groups/318265/items/${zoteroKey}?format=json&include=citation&style=${citationStyle}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        )
      )
    );

    const zoteroJsons = await Promise.all(
      zoteroResponses.map(APIresponse => APIresponse.json())
    );

    const zoteroCitations: string[] = zoteroJsons.map(res => res.citation);

    const resourceLinks: string[] = await Promise.all(
      objUuids.map(uuid => ResourceDao.getResourceLinkByUuid(uuid))
    );

    const zoteroData = zoteroCitations.map((cit, idx) => ({
      citation: cit,
      link: resourceLinks[idx],
    }));

    const text = await TextDao.getTextByUuid(textUuid);

    if (!text) {
      next(
        new HttpBadRequest(`Text with UUID ${textUuid} does not exist`, true)
      );
      return;
    }

    const canViewText = await CollectionTextUtils.canViewText(
      textUuid,
      userUuid
    );

    if (!canViewText) {
      next(
        new HttpForbidden(
          'You do not have permission to view this text. If you think this is a mistake, please contact your administrator.'
        )
      );
      return;
    }

    const collection = await CollectionDao.getTextCollection(text.uuid);

    if (!collection) {
      next(new HttpBadRequest('Text does not belong to a valid collection'));
      return;
    }

    const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
    const cdliNum = await TextDao.getCdliNum(textUuid);
    const { color, colorMeaning } = await TextDao.getTranslitStatus(textUuid);
    const discourseUnits = await TextDiscourseDao.getTextDiscourseUnits(
      textUuid
    );
    const canWrite = await CollectionTextUtils.canEditText(textUuid, userUuid);
    const draft = user
      ? await TextDraftsDao.getDraftByTextUuid(user.uuid, textUuid)
      : null;

    const hasEpigraphies = await TextEpigraphyDao.hasEpigraphy(textUuid);

    const response: EpigraphyResponse = {
      text,
      collection,
      units,
      canWrite,
      cdliNum,
      color,
      colorMeaning,
      discourseUnits,
      ...(draft ? { draft } : {}),
      hasEpigraphy: hasEpigraphies,
      zoteroData,
    };

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/text_epigraphies/text_source/:uuid')
  .get(permissionsRoute('VIEW_TEXT_FILE'), async (req, res, next) => {
    try {
      const { uuid: textUuid } = req.params;
      const ResourceDao = sl.get('ResourceDao');
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

        res.json(textContent);
      } else {
        res.json(null);
      }
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

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

      const {
        resources,
        links,
      }: { resources: ResourceRow[]; links: LinkRow[] } = req.body;

      await Promise.all(
        resources.map(row => ResourceDao.insertResourceRow(row))
      );

      await Promise.all(links.map(row => ResourceDao.insertLinkRow(row)));

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

      const { tables }: CreateTextsPayload = req.body;

      const existingTextRow = await TextDao.getTextRowByUuid(tables.text.uuid);
      const addingToExistingText = !!existingTextRow;

      // Text
      if (!addingToExistingText) {
        await TextDao.insertTextRow(tables.text);
      } else {
        await TextDao.updateTextInfo(
          tables.text.uuid,
          tables.text.excavationPrefix,
          tables.text.excavationNumber,
          tables.text.museumPrefix,
          tables.text.museumNumber,
          tables.text.publicationPrefix,
          tables.text.publicationNumber
        );
      }

      // Hierarchy
      if (!addingToExistingText) {
        await HierarchyDao.insertHierarchyRow(tables.hierarchy);
      }

      // Item Properties
      if (!addingToExistingText) {
        const itemPropertyRowLevels = [
          ...new Set(tables.itemProperties.map(row => row.level)),
        ];
        const rowsByLevel: InsertItemPropertyRow[][] = itemPropertyRowLevels.map(
          level => tables.itemProperties.filter(row => row.level === level)
        );
        for (let i = 0; i < rowsByLevel.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            rowsByLevel[i].map(row => ItemPropertiesDao.addProperty(row))
          );
        }
      }

      // Resource
      await Promise.all(
        tables.resources.map(row => ResourceDao.insertResourceRow(row))
      );

      // Link
      await Promise.all(
        tables.links.map(row => ResourceDao.insertLinkRow(row))
      );

      // Tree
      await Promise.all(tables.trees.map(row => TreeDao.insertTreeRow(row)));

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
            TextDiscourseDao.insertDiscourseRow(row)
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
            TextEpigraphyDao.insertEpigraphyRow(row)
          )
        );
      }

      // Markup
      await Promise.all(
        tables.markups.map(row => TextMarkupDao.insertMarkupRow(row))
      );

      await PublicDenylistDao.addItemsToDenylist([tables.text.uuid], 'text');

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
  .route('/text_epigraphies/has_epigraphy/:textUuid')
  .get(async (req, res, next) => {
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    try {
      const { textUuid } = req.params;
      const userUuid = req.user ? req.user.uuid : null;

      const canViewText = await CollectionTextUtils.canViewText(
        textUuid,
        userUuid
      );
      if (!canViewText) {
        next(
          new HttpForbidden(
            'You do not have permission to view this text. If you think this is a mistake, please contact your administrator.'
          )
        );
        return;
      }

      const hasEpigraphy = await TextEpigraphyDao.hasEpigraphy(textUuid);

      res.json(hasEpigraphy);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });
export default router;
