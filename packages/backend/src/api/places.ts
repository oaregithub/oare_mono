import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/router/cache';
import { dictionaryFilter } from '@/cache/filters';
import { Word } from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';

// COMPLETE

const router = express.Router();

router
  .route('/places/:letter')
  .get(
    permissionsRoute('PLACES'),
    cacheMiddleware<Word[]>(dictionaryFilter),
    async (req, res, next) => {
      try {
        const cache = sl.get('cache');
        const DictionaryWordDao = sl.get('DictionaryWordDao');

        const { letter } = req.params;

        const dictionaryPlaces = await DictionaryWordDao.getWords(
          'GN',
          letter.toLowerCase()
        );

        const response = await cache.insert<Word[]>(
          { req },
          dictionaryPlaces,
          dictionaryFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
