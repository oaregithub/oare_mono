import express from 'express';
import { AddDenylistAllowlistPayload, DenylistAllowlist } from '@oare/types';
import adminRoute from '@/middlewares/router/adminRoute';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

// FIXME

// FIXME unrelated to this file, but some of the logic in the server start command could be moved into
/// the build or zip sh files. Those both could be cleaned up.

// FIXME Should probably add HTTP 400 checks

// FIXME migration to remove rows that had a type of collection

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
      // FIXME this function doesn't quite work right. Need to rework ResourceDao
      const images = await Promise.all(
        denylistImages.map(uuid => ResourceDao.getAllowListImageWithText(uuid))
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

      const { uuids, type }: AddDenylistAllowlistPayload = req.body;

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
