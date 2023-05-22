import express from 'express';
import { HttpInternalError } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/router/collections';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/router/cache';
import { Collection } from '@oare/types';
import { collectionTextsFilter, collectionFilter } from '@/cache/filters';

// VERIFIED COMPLETE

const router = express.Router();

router
  .route('/collections')
  .get(
    cacheMiddleware<Collection[]>(collectionFilter),
    async (req, res, next) => {
      try {
        const CollectionDao = sl.get('CollectionDao');
        const cache = sl.get('cache');

        const collectionUuids = await CollectionDao.getAllCollectionUuids();

        const collections = await Promise.all(
          collectionUuids.map(uuid => CollectionDao.getCollectionByUuid(uuid))
        );

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
    cacheMiddleware<Collection>(collectionTextsFilter),
    async (req, res, next) => {
      try {
        const cache = sl.get('cache');
        const CollectionDao = sl.get('CollectionDao');

        const uuid = req.params.uuid as string;

        const collection = await CollectionDao.getCollectionByUuid(uuid);

        const response = await cache.insert<Collection>(
          { req },
          collection,
          collectionTextsFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
