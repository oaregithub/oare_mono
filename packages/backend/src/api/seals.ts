import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import cacheMiddleware from '@/middlewares/router/cache';
import {
  Seal,
  ItemPropertyRow,
  SealCore,
  ConnectSealImpressionPayload,
} from '@oare/types';
import { sealFilter, sealListFilter } from '@/cache/filters';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import { v4 } from 'uuid';

const router = express.Router();

router
  .route('/seals')
  .get(
    permissionsRoute('SEALS'),
    cacheMiddleware<SealCore[]>(sealListFilter),
    async (req, res, next) => {
      try {
        const SpatialUnitDao = sl.get('SpatialUnitDao');
        const cache = sl.get('cache');

        const sealUuids = await SpatialUnitDao.getAllSealUuids();

        const seals = await Promise.all(
          sealUuids.map(uuid => SpatialUnitDao.getSealCoreByUuid(uuid))
        );

        const response = await cache.insert<SealCore[]>(
          { req },
          seals,
          sealListFilter
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
    cacheMiddleware<Seal>(sealFilter),
    async (req, res, next) => {
      try {
        const SpatialUnitDao = sl.get('SpatialUnitDao');
        const cache = sl.get('cache');

        const uuid = req.params.uuid as string;

        const sealExists = await SpatialUnitDao.spatialUnitExists(uuid);
        if (!sealExists) {
          next(new HttpBadRequest('Seal does not exist'));
          return;
        }

        const seal = await SpatialUnitDao.getSealByUuid(uuid);

        const response = await cache.insert<Seal>({ req }, seal, sealFilter);

        res.json(response);
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  )
  .patch(permissionsRoute('EDIT_SEAL'), async (req, res, next) => {
    try {
      const AliasDao = sl.get('AliasDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const { name } = req.body;

      await utils.createTransaction(async trx => {
        await AliasDao.updateName(uuid, name, 1, trx);
      });

      await cache.clear('/seals', { level: 'exact' });
      await cache.clear(`/seals/${uuid}`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/seal_impression')
  .patch(permissionsRoute('ADD_SEAL_LINK'), async (req, res, next) => {
    try {
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const cache = sl.get('cache');
      const utils = sl.get('utils');

      const {
        sealUuid,
        textEpigraphyUuid,
      } = req.body as ConnectSealImpressionPayload;

      const itemProperties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
        textEpigraphyUuid
      );

      const relevantProperties = itemProperties.filter(
        prop => prop.valueUuid === 'ec820e17-ecc7-492f-86a7-a01b379622e1'
      );

      const parentUuid =
        relevantProperties.length > 0 ? relevantProperties[0].uuid : null;

      const itemProperty: ItemPropertyRow = {
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
        await ItemPropertiesDao.insertItemPropertyRows([itemProperty], trx);
      });

      await cache.clear('/seals', { level: 'exact' });
      await cache.clear(`/seals/${sealUuid}`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/seal_impression/:uuid')
  .get(permissionsRoute('ADD_SEAL_LINK'), async (req, res, next) => {
    try {
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');

      const { uuid } = req.params;

      const itemProperties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
        uuid
      );

      const relevantProperties = itemProperties.filter(
        prop =>
          prop.variableUuid === 'f32e6903-67c9-41d8-840a-d933b8b3e719' &&
          prop.objectUuid !== null
      );

      const sealImpressionProperty = relevantProperties[0] || null;

      res.json(sealImpressionProperty);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
