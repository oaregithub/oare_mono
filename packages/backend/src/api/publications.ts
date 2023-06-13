import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { Publication } from '@oare/types';
import cacheMiddleware from '@/middlewares/router/cache';
import { publicationsFilter } from '@/cache/filters';

// COMPLETE

const router = express.Router();

router
  .route('/publications')
  .get(
    cacheMiddleware<Publication[]>(publicationsFilter),
    async (req, res, next) => {
      try {
        const PublicationDao = sl.get('PublicationDao');
        const cache = sl.get('cache');

        const prefixes = await PublicationDao.getAllPublicationPrefixes();

        const publications = await Promise.all(
          prefixes.map(prefix => PublicationDao.getPublicationByPrefix(prefix))
        );

        const response = await cache.insert<Publication[]>(
          { req },
          publications,
          publicationsFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
