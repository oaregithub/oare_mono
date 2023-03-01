import express from 'express';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import cacheMiddleware from '@/middlewares/cache';
import { HttpInternalError } from '@/exceptions';
import { PeriodResponse, Year } from '@oare/types';
import { noFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/periods')
  .get(
    permissionsRoute('PERIODS'),
    cacheMiddleware<PeriodResponse>(noFilter),
    async (req, res, next) => {
      try {
        const cache = sl.get('cache');
        const PeriodsDao = sl.get('PeriodsDao');

        const yearRows = await PeriodsDao.getPeriodRows(
          '01da4ab2-6ea0-49f3-8752-759ca4bd5cdc',
          'OA Calendar Year'
        );

        const monthRows = await PeriodsDao.getPeriodRows(
          '01da4ab2-6ea0-49f3-8752-759ca4bd5cdc',
          'OA Month'
        );
        const weekRows = await PeriodsDao.getPeriodRows(
          '01da4ab2-6ea0-49f3-8752-759ca4bd5cdc',
          'OA hamuštum'
        );

        const years: Year[] = await PeriodsDao.getYears(
          yearRows,
          monthRows,
          weekRows
        );

        const periods: PeriodResponse = {
          years,
        };

        const response = await cache.insert<PeriodResponse>(
          { req },
          periods,
          noFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
