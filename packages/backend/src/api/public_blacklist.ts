import express from 'express';
import { AddPublicBlacklistPayload, PublicBlacklistPayloadItem } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { API_PATH } from '@/setupRoutes';
import sl from '@/serviceLocator';

async function canInsert(texts: PublicBlacklistPayloadItem[]) {
  const PublicBlacklistDao = sl.get('PublicBlacklistDao');
  const blacklistTexts = (await PublicBlacklistDao.getBlacklistedTexts()).map((text) => text.uuid);
  const blacklistCollections = (await PublicBlacklistDao.getBlacklistedCollections()).map(
    (collection) => collection.uuid,
  );
  const existingBlacklist = new Set(blacklistTexts.concat(blacklistCollections));
  for (let i = 0; i < texts.length; i += 1) {
    if (existingBlacklist.has(texts[i].uuid)) {
      return false;
    }
  }
  return true;
}

async function canRemove(uuid: string) {
  const PublicBlacklistDao = sl.get('PublicBlacklistDao');
  const blacklistTexts = (await PublicBlacklistDao.getBlacklistedTexts()).map((text) => text.uuid);
  const blacklistCollections = (await PublicBlacklistDao.getBlacklistedCollections()).map(
    (collection) => collection.uuid,
  );
  const existingBlacklist = blacklistTexts.concat(blacklistCollections);
  if (!existingBlacklist.includes(uuid)) {
    return false;
  }
  return true;
}

function clearCache() {
  const cache = sl.get('cache');
  cache.clear(
    {
      req: {
        originalUrl: `${API_PATH}/collections`,
        method: 'GET',
      },
    },
    { exact: false },
  );
}

const router = express.Router();

router
  .route('/public_blacklist')
  .get(adminRoute, async (req, res, next) => {
    try {
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const publicBlacklist = await PublicBlacklistDao.getBlacklistedTexts();
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

      const insertRows = texts.map((item) => ({
        uuid: item.uuid,
        type: item.type,
      }));

      const insertIds = await PublicBlacklistDao.addPublicTexts(insertRows, async (trx) => {
        await Promise.all(
          texts.map((text) => LoggingEditsDao.logEdit('INSERT', req.user!.uuid, 'public_blacklist', text.uuid, trx)),
        );
      });
      clearCache();
      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/public_blacklist/:uuid').delete(adminRoute, async (req, res, next) => {
  try {
    const LoggingEditsDao = sl.get('LoggingEditsDao');
    const PublicBlacklistDao = sl.get('PublicBlacklistDao');
    const { uuid } = req.params;

    if (!(await canRemove(uuid))) {
      next(new HttpBadRequest('One or more of the selected texts does not exist in the blacklist'));
      return;
    }

    await PublicBlacklistDao.removePublicTexts(uuid, async (trx) => {
      await LoggingEditsDao.logEdit('DELETE', req.user!.uuid, 'public_blacklist', uuid, trx);
    });
    clearCache();
    res.end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/public_blacklist/collections').get(adminRoute, async (_req, res, next) => {
  try {
    const PublicBlacklistDao = sl.get('PublicBlacklistDao');
    const publicBlacklist = await PublicBlacklistDao.getBlacklistedCollections();
    res.json(publicBlacklist);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
