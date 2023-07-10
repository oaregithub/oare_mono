import express from 'express';
import { AddDenylistAllowlistPayload, DenylistAllowlist } from '@oare/types';
import adminRoute from '@/middlewares/router/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/public_denylist')
  .get(adminRoute, async (_req, res, next) => {
    try {
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const ResourceDao = sl.get('ResourceDao');
      const TextDao = sl.get('TextDao');

      const denylistTexts = await PublicDenylistDao.getDenylist('text');
      const denylistImages = await PublicDenylistDao.getDenylist('img');

      const texts = await Promise.all(
        denylistTexts.map(uuid => TextDao.getTextByUuid(uuid))
      );
      const images = await Promise.all(
        denylistImages.map(uuid => ResourceDao.getS3ImageByUuid(uuid))
      );

      const response: DenylistAllowlist = {
        texts,
        images,
      };

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const TextDao = sl.get('TextDao');
      const ResourceDao = sl.get('ResourceDao');

      const { uuids, type }: AddDenylistAllowlistPayload = req.body;

      // Make sure all UUIDs exist
      if (type === 'text') {
        const textsExist = await Promise.all(
          uuids.map(uuid => TextDao.textExists(uuid))
        );
        if (textsExist.includes(false)) {
          next(new HttpBadRequest('One or more texts do not exist'));
          return;
        }
      } else if (type === 'img') {
        const imagesExist = await Promise.all(
          uuids.map(uuid => ResourceDao.resourceExists(uuid))
        );
        if (imagesExist.includes(false)) {
          next(new HttpBadRequest('One or more images do not exist'));
          return;
        }
      } else {
        next(new HttpBadRequest('Invalid type'));
        return;
      }

      await PublicDenylistDao.addItemsToDenylist(uuids, type);

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/public_denylist/:uuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const PublicDenylistDao = sl.get('PublicDenylistDao');

      const { uuid } = req.params;

      await PublicDenylistDao.removeItemFromDenylist(uuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
