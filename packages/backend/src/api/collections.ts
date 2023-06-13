import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/router/collections';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/router/cache';
import { Collection, CollectionRow } from '@oare/types';
import { collectionTextsFilter, collectionFilter } from '@/cache/filters';

// COMPLETE

const router = express.Router();

router
  .route('/collections')
  .get(
    cacheMiddleware<CollectionRow[]>(collectionFilter),
    async (req, res, next) => {
      try {
        const CollectionDao = sl.get('CollectionDao');
        const cache = sl.get('cache');

        const collectionUuids = await CollectionDao.getAllCollectionUuids();

        const collectionRows = await Promise.all(
          collectionUuids.map(uuid =>
            CollectionDao.getCollectionRowByUuid(uuid)
          )
        );

        const response = await cache.insert<CollectionRow[]>(
          { req },
          collectionRows,
          collectionFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/collection/:uuid')
  .get(
    collectionsMiddleware,
    cacheMiddleware<Collection>(collectionTextsFilter),
    async (req, res, next) => {
      try {
        const cache = sl.get('cache');
        const CollectionDao = sl.get('CollectionDao');

        const { uuid } = req.params;

        const collectionExists = await CollectionDao.collectionExists(uuid);
        if (!collectionExists) {
          next(new HttpBadRequest('Collection does not exist'));
          return;
        }

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
