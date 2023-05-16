import express from 'express';
import { HttpInternalError } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/router/collections';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/router/cache';
import { CollectionResponse, Collection } from '@oare/types';
import { collectionTextsFilter, collectionFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/collections')
  .get(
    cacheMiddleware<Collection[]>(collectionFilter),
    async (req, res, next) => {
      try {
        const CollectionDao = sl.get('CollectionDao');
        const cache = sl.get('cache');

        const collectionUuids = await CollectionDao.getAllCollections();
        const collections = (
          await Promise.all(
            collectionUuids.map(uuid => CollectionDao.getCollectionByUuid(uuid))
          )
        )
          .filter(collection => collection)
          .map(collection => collection!);

        const response = await cache.insert<Collection[]>(
          { req },
          collections,
          collectionFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/collections/:uuid')
  .get(
    collectionsMiddleware,
    cacheMiddleware<CollectionResponse>(collectionTextsFilter),
    async (req, res, next) => {
      try {
        const uuid = req.params.uuid as string;

        const cache = sl.get('cache');
        const HierarchyDao = sl.get('HierarchyDao');

        const texts = await HierarchyDao.getCollectionTexts(uuid);

        const response = await cache.insert<CollectionResponse>(
          { req },
          texts,
          collectionTextsFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

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
