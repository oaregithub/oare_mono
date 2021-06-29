import express from 'express';
import { DenylistAllowlistPayload } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { API_PATH } from '@/setupRoutes';
import sl from '@/serviceLocator';

async function canInsert(uuids: string[]) {
  const PublicBlacklistDao = sl.get('PublicBlacklistDao');
  const denylistTextUuids = await PublicBlacklistDao.getDenylistTextUuids();
  const denylistCollectionUuids = await PublicBlacklistDao.getDenylistCollectionUuids();
  const existingDenylist = new Set(
    denylistTextUuids.concat(denylistCollectionUuids)
  );
  for (let i = 0; i < uuids.length; i += 1) {
    if (existingDenylist.has(uuids[i])) {
      return false;
    }
  }
  return true;
}

async function canRemove(uuid: string) {
  const PublicBlacklistDao = sl.get('PublicBlacklistDao');
  const denylistTextUuids = await PublicBlacklistDao.getDenylistTextUuids();
  const denylistCollectionUuids = await PublicBlacklistDao.getDenylistCollectionUuids();
  const existingDenylist = denylistTextUuids.concat(denylistCollectionUuids);
  if (!existingDenylist.includes(uuid)) {
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
    { exact: false }
  );
}

const router = express.Router();

router
  .route('/public_blacklist')
  .get(adminRoute, async (req, res, next) => {
    try {
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const publicBlacklist = await PublicBlacklistDao.getDenylistTextUuids();
      const epigraphyStatus = await Promise.all(
        publicBlacklist.map(text => TextEpigraphyDao.hasEpigraphy(text))
      );
      const response = publicBlacklist.map((uuid, index) => ({
        uuid,
        hasEpigraphy: epigraphyStatus[index],
      }));
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const { uuids, type }: DenylistAllowlistPayload = req.body;

      if (!(await canInsert(uuids))) {
        next(
          new HttpBadRequest(
            'One or more of the selected texts is already denylisted'
          )
        );
        return;
      }

      const insertIds = await PublicBlacklistDao.addItemsToDenylist(
        uuids,
        type
      );
      clearCache();
      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/public_blacklist/:uuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const { uuid } = req.params;

      if (!(await canRemove(uuid))) {
        next(
          new HttpBadRequest(
            'One or more of the selected texts does not exist in the blacklist'
          )
        );
        return;
      }

      await PublicBlacklistDao.removeItemFromDenylist(uuid);
      clearCache();
      res.end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/public_blacklist/collections')
  .get(adminRoute, async (_req, res, next) => {
    try {
      const PublicBlacklistDao = sl.get('PublicBlacklistDao');
      const denylistCollections = await PublicBlacklistDao.getDenylistCollectionUuids();
      res.json(denylistCollections);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
