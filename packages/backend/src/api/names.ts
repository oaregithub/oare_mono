import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/router/cache';
import { dictionaryFilter } from '@/cache/filters';
import { Word } from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';

// VERIFIED COMPLETE - Dao function will need some work

const router = express.Router();

router
  .route('/names/:letter')
  .get(
    permissionsRoute('NAMES'),
    cacheMiddleware<Word[]>(dictionaryFilter),
    async (req, res, next) => {
      try {
        const cache = sl.get('cache');
        const DictionaryWordDao = sl.get('DictionaryWordDao');

        const { letter } = req.params;

        const dictionaryNames = await DictionaryWordDao.getWords(
          'PN',
          letter.toLowerCase()
        );

        const response = await cache.insert<Word[]>(
          { req },
          dictionaryNames,
          dictionaryFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
