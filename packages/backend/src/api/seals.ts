import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/cache';
import { SealNameUuid, SealInfo, Seal, SealImpression } from '@oare/types';
import { noFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/seals')
  .get(cacheMiddleware<SealInfo[]>(noFilter), async (req, res, next) => {
    try {
      const SealDao = sl.get('SealDao');
      const cache = sl.get('cache');

      const sealsNameAndUuid: SealNameUuid[] = await SealDao.getSeals();
      const seals: SealInfo[] = await Promise.all(
        sealsNameAndUuid.map(async s => ({
          ...s,
          imageLinks: await SealDao.getImagesBySealUuid(s.uuid),
          count: await SealDao.getSealImpressionCountBySealUuid(s.uuid),
        }))
      );

      const response = await cache.insert<SealInfo[]>({ req }, seals, noFilter);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/seals/:uuid')
  .get(cacheMiddleware<Seal>(noFilter), async (req, res, next) => {
    try {
      const uuid = req.params.uuid as string;
      const SealDao = sl.get('SealDao');
      const TextDao = sl.get('TextDao');
      const cache = sl.get('cache');

      const nameAndUuid: SealNameUuid = await SealDao.getSealByUuid(uuid);
      const sealImpressions: SealImpression[] = await SealDao.getSealImpressionsBySealUuid(
        uuid
      );

      const seal: Seal = {
        ...nameAndUuid,
        imageLinks: await SealDao.getImagesBySealUuid(uuid),
        count: await SealDao.getSealImpressionCountBySealUuid(uuid),
        sealProperties: await SealDao.getSealProperties(uuid),
        sealImpressions,
      };

      const response = await cache.insert<Seal>({ req }, seal, noFilter);

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;