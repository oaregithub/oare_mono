import express from 'express';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import {
  EditTextInfoPayload,
  TextTransliterationStatus,
  UpdateTextTransliterationStatusPayload,
} from '@oare/types';

// MOSTLY COMPLETE

const router = express.Router();

router
  .route('/text/transliteration')
  .get(
    permissionsRoute('EDIT_TRANSLITERATION_STATUS'),
    async (_req, res, next) => {
      try {
        const TextDao = sl.get('TextDao');

        const transliterationStatuses: TextTransliterationStatus[] = await TextDao.getTransliterationOptions();

        res.json(transliterationStatuses);
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
        const cache = sl.get('cache');

        const {
          textUuid,
          color,
        }: UpdateTextTransliterationStatusPayload = req.body;

        await TextDao.updateTransliterationStatus(textUuid, color);

        // FIXME will need to revisit all cache clears to make sure they point to the right place now that changes have been made.
        await cache.clear(`/epigraphies/text/${textUuid}`, {
          level: 'startsWith',
        });

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/text/:uuid')
  .patch(permissionsRoute('EDIT_TEXT_INFO'), async (req, res, next) => {
    try {
      const TextDao = sl.get('TextDao');
      const CollectionDao = sl.get('CollectionDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;
      const {
        excavationPrefix,
        excavationNumber,
        museumPrefix,
        museumNumber,
        publicationPrefix,
        publicationNumber,
      }: EditTextInfoPayload = req.body;

      await TextDao.updateTextInfo(
        uuid,
        excavationPrefix,
        excavationNumber,
        museumPrefix,
        museumNumber,
        publicationPrefix,
        publicationNumber
      );

      const collectionUuid = await CollectionDao.getCollectionUuidByTextUuid(
        uuid
      );

      // FIXME will need to revisit all cache clears to make sure they point to the right place now that changes have been made.
      await cache.clear(`/epigraphies/${uuid}`, {
        level: 'startsWith',
      });
      await cache.clear(`/collection/${collectionUuid}`, {
        level: 'exact',
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
