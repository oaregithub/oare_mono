import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/router/cache';
import {
  SealNameUuid,
  SealInfo,
  Seal,
  InsertItemPropertyRow,
  AddSealLinkPayload,
} from '@oare/types';
import { SealFilter, SealListFilter } from '@/cache/filters';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import { v4 } from 'uuid';

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
            count: 0,
          }))
        );

        const response = await cache.insert<SealInfo[]>(
          { req },
          seals,
          SealListFilter
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

        const seal: Seal = {
          ...nameAndUuid,
          imageLinks: await SealDao.getImagesBySealUuid(uuid),
          count: 0,
          sealProperties: await SealDao.getSealProperties(uuid),
          sealImpressions: [],
        };

        const response = await cache.insert<Seal>({ req }, seal, SealFilter);

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

      await cache.clear('/seals', { level: 'exact' });
      await cache.clear(`/seals/${uuid}`, { level: 'exact' });
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/connect/seal_impression')
  .post(permissionsRoute('ADD_SEAL_LINK'), async (req, res, next) => {
    try {
      const SealDao = sl.get('SealDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');
      const { sealUuid, textEpigraphyUuid } = req.body as AddSealLinkPayload;

      const parentUuid: string = await SealDao.getSealLinkParentUuid(
        textEpigraphyUuid
      );

      const itemProperty: InsertItemPropertyRow = {
        uuid: v4(),
        referenceUuid: textEpigraphyUuid,
        objectUuid: sealUuid,
        parentUuid,
        variableUuid: 'f32e6903-67c9-41d8-840a-d933b8b3e719',
        level: 1,
        valueUuid: null,
        value: null,
      };

      await utils.createTransaction(async trx => {
        await ItemPropertiesDao.addProperties([itemProperty], trx);
      });

      await cache.clear('/seals', { level: 'exact' });
      await cache.clear(`/seals/${sealUuid}`, { level: 'exact' });
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
