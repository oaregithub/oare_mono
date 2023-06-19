import express from 'express';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import { HttpInternalError } from '@/exceptions';
import { PeriodResponse } from '@oare/types';

// COMPLETE

const router = express.Router();

router.route('/periods').get(
  permissionsRoute('PERIODS'),
  cacheMiddleware<PeriodResponse>(null), // FIXME should there a be a cache filter to remove texts that the user can't see?
  async (req, res, next) => {
    try {
      const cache = sl.get('cache');
      const PeriodsDao = sl.get('PeriodsDao');

      const periods = await PeriodsDao.getPeriods();

      const response = await cache.insert<PeriodResponse>(
        { req },
        periods,
        null
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  }
);

export default router;
