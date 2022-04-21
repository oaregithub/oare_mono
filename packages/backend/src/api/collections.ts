import express from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/collections';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/collections').get(async (req, res, next) => {
  try {
    const userUuid = req.user ? req.user.uuid : null;

    const CollectionDao = sl.get('CollectionDao');

    const collectionUuids = await CollectionDao.getAllCollections(userUuid);
    const collections = await Promise.all(
      collectionUuids.map(uuid => CollectionDao.getCollectionByUuid(uuid))
    );

    res.json(collections.filter(collection => collection));
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/collections/:uuid')
  .get(collectionsMiddleware, async (req, res, next) => {
    try {
      const CollectionTextUtils = sl.get('CollectionTextUtils');
      const uuid = req.params.uuid as string;
      const userUuid = req.user ? req.user.uuid : null;
      const utils = sl.get('utils');

      const canViewCollection = await CollectionTextUtils.canViewCollection(
        uuid,
        userUuid
      );
      if (!canViewCollection) {
        next(
          new HttpForbidden(
            'You do not have permission to view this collection. If you think this is a mistake, please contact your administrator.'
          )
        );
        return;
      }

      const { filter: search, limit: rows, page } = utils.extractPagination(
        req.query
      );

      const HierarchyDao = sl.get('HierarchyDao');

      const response = await HierarchyDao.getCollectionTexts(userUuid, uuid, {
        page,
        rows,
        search,
      });

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/collection_hierarchy/:collectionUuid')
  .get(async (req, res, next) => {
    try {
      const HierarchyDao = sl.get('HierarchyDao');
      const { collectionUuid } = req.params;

      const parentUuid = await HierarchyDao.getParentUuidByCollection(
        collectionUuid
      );

      res.json(parentUuid);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
