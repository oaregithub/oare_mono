import express from 'express';
import { AddPublicBlacklistPayload, PublicBlacklistPayloadItem } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpForbidden, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

async function canInsert(texts: PublicBlacklistPayloadItem[]) {
  const PublicBlacklistDao = sl.get('PublicBlacklistDao');
  const existingBlacklist = await PublicBlacklistDao.getPublicTexts();
  const existingTexts = new Set(existingBlacklist.map((text) => text.text_uuid));
  for (let i = 0; i < texts.length; i += 1) {
    if (existingTexts.has(texts[i].uuid)) {
      return false;
    }
  }
  return true;
}

const router = express.Router();

router
  .route('/public_blacklist')
  .get(adminRoute, async (req, res, next) => {
    try {
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const publicBlacklist = await PublicBlacklistDao.getPublicTexts();
      res.json(publicBlacklist);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const LoggingEditsDao = sl.get('LoggingEditsDao');
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const { texts }: AddPublicBlacklistPayload = req.body;

      if (!(await canInsert(texts))) {
        next(new HttpBadRequest('One or more of the selected texts is already blacklisted'));
        return;
      }

      const insertIds = await PublicBlacklistDao.addPublicTexts(texts, async (trx) => {
        await Promise.all(
          texts.map((text) => LoggingEditsDao.logEdit('INSERT', req.user!.uuid, 'public_blacklist', text.uuid, trx)),
        );
      });

      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
