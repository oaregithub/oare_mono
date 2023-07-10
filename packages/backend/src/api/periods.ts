import express from 'express';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import { HttpInternalError } from '@/exceptions';
import { PeriodResponse } from '@oare/types';
import { periodsFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/periods')
  .get(
    permissionsRoute('PERIODS'),
    cacheMiddleware<PeriodResponse>(periodsFilter),
    async (req, res, next) => {
      try {
        const cache = sl.get('cache');
        const PeriodsDao = sl.get('PeriodsDao');

        const periods = await PeriodsDao.getPeriods();

        const response = await cache.insert<PeriodResponse>(
          { req },
          periods,
          periodsFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
