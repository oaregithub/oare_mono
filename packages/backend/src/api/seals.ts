import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/cache';
import { SealNameUuid, SealInfo, Seal, SealImpression } from '@oare/types';
import { noFilter, SealFilter, SealListFilter } from '@/cache/filters';
import permissionsRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/seals')
  .get(
    permissionsRoute('SEALS'),
    cacheMiddleware<SealInfo[]>(SealListFilter),
    async (req, res, next) => {
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

        const response = await cache.insert<SealInfo[]>(
          { req },
          seals,
          noFilter
        );

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router
  .route('/seals/:uuid')
  .get(
    permissionsRoute('SEALS'),
    cacheMiddleware<Seal>(SealFilter),
    async (req, res, next) => {
      try {
        const uuid = req.params.uuid as string;
        const SealDao = sl.get('SealDao');
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
    }
  )
  .patch(permissionsRoute('EDIT_SEAL'), async (req, res, next) => {
    try {
      const SealDao = sl.get('SealDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const { name } = req.body;

      await utils.createTransaction(async trx => {
        await SealDao.updateSealSpelling(uuid, name, trx);
      });

      await cache.clear('/seals', { level: 'exact' }, req);
      await cache.clear(`/seals/${uuid}`, { level: 'exact' }, req);
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
