import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { Sign } from '@oare/types';
import cacheMiddleware from '@/middlewares/router/cache';

// COMPLETE

const router = express.Router();

router
  .route('/signs')
  .get(cacheMiddleware<Sign[]>(null), async (req, res, next) => {
    try {
      const SignDao = sl.get('SignDao');
      const cache = sl.get('cache');

      const uuids = await SignDao.getAllSignUuids();

      const signs = await Promise.all(
        uuids.map(uuid => SignDao.getSignByUuid(uuid))
      );

      const sortedSigns = signs.sort((a, b) => a.name.localeCompare(b.name));

      const response = await cache.insert<Sign[]>({ req }, sortedSigns, null);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/signs/:uuid')
  .get(cacheMiddleware<Sign>(null), async (req, res, next) => {
    try {
      const SignDao = sl.get('SignDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;

      const signExists = await SignDao.signExists(uuid);
      if (!signExists) {
        next(new HttpInternalError('Sign does not exist'));
        return;
      }

      const sign = await SignDao.getSignByUuid(uuid);

      const response = await cache.insert<Sign>({ req }, sign, null);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/signs/reading/:reading')
  .get(cacheMiddleware<Sign>(null), async (req, res, next) => {
    try {
      const SignReadingDao = sl.get('SignReadingDao');
      const cache = sl.get('cache');

      const { reading } = req.params;

      const sign = await SignReadingDao.getSignByReading(reading);

      const response = await cache.insert<Sign>({ req }, sign, null);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
