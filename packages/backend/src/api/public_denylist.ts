import express from 'express';
import { DenylistAllowlistPayload } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { API_PATH } from '@/setupRoutes';
import sl from '@/serviceLocator';

async function canInsert(uuids: string[]) {
  const PublicDenylistDao = sl.get('PublicDenylistDao');
  const denylistTextUuids = await PublicDenylistDao.getDenylistTextUuids();
  const denylistCollectionUuids = await PublicDenylistDao.getDenylistCollectionUuids();
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
  const PublicDenylistDao = sl.get('PublicDenylistDao');
  const denylistTextUuids = await PublicDenylistDao.getDenylistTextUuids();
  const denylistCollectionUuids = await PublicDenylistDao.getDenylistCollectionUuids();
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
  .route('/public_denylist')
  .get(adminRoute, async (_req, res, next) => {
    try {
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const publicBlacklist = await PublicDenylistDao.getDenylistTextUuids();
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
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const { uuids, type }: DenylistAllowlistPayload = req.body;

      if (!(await canInsert(uuids))) {
        next(
          new HttpBadRequest(
            'One or more of the selected texts or collections is already denylisted'
          )
        );
        return;
      }

      const insertIds = await PublicDenylistDao.addItemsToDenylist(uuids, type);
      clearCache();
      res.status(201).json(insertIds);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/public_denylist/:uuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const { uuid } = req.params;

      if (!(await canRemove(uuid))) {
        next(
          new HttpBadRequest(
            'One or more of the selected texts or collections does not exist in the denylist'
          )
        );
        return;
      }

      await PublicDenylistDao.removeItemFromDenylist(uuid);
      clearCache();
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/public_denylist/collections')
  .get(adminRoute, async (_req, res, next) => {
    try {
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const denylistCollections = await PublicDenylistDao.getDenylistCollectionUuids();
      const response = denylistCollections.map(collectionUuid => ({
        uuid: collectionUuid,
      }));
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
