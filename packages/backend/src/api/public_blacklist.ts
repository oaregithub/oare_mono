import express from 'express';
import { AddPublicBlacklistPayload, PublicBlacklistPayloadItem } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpForbidden, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

async function canInsert(texts: PublicBlacklistPayloadItem[]) {
  const PublicBlacklistDao = sl.get('PublicBlacklistDao');
  const existingBlacklist = await PublicBlacklistDao.getPublicTexts();
  const existingTexts = existingBlacklist.map((text) => text.text_uuid);
  for (let i = 0; i < texts.length; i += 1) {
    if (existingTexts.includes(texts[i].uuid)) {
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
      const user = req.user || null;

      if (!user || !user.isAdmin) {
        next(
          new HttpForbidden(
            'You do not have permission to view this data. If you think this is a mistake, please contact your administrator.',
          ),
        );
        return;
      }

      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const publicBlacklist = await PublicBlacklistDao.getPublicTexts();
      res.json(publicBlacklist);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const user = req.user || null;
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const { texts }: AddPublicBlacklistPayload = req.body;

      if (!user || !user.isAdmin) {
        next(
          new HttpForbidden(
            'You do not have permission to change this data. If you think this is a mistake, please contact your administrator.',
          ),
        );
        return;
      }

      if (!(await canInsert(texts))) {
        next(new HttpBadRequest('One or more of the selected texts is already blacklisted'));
        return;
      }

      const insertIds = await PublicBlacklistDao.addPublicTexts(texts);
      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
