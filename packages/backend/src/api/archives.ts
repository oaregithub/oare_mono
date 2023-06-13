import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { Archive, Dossier } from '@oare/types';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import { archiveFilter, archivesFilter, dossierFilter } from '@/cache/filters';

// COMPLETE

const router = express.Router();

router
  .route('/archives')
  .get(cacheMiddleware<Archive[]>(archivesFilter), async (req, res, next) => {
    try {
      const ArchiveDao = sl.get('ArchiveDao');
      const cache = sl.get('cache');

      const archiveUuids = await ArchiveDao.getAllArchiveUuids();
      const archives = await Promise.all(
        archiveUuids.map(uuid => ArchiveDao.getArchiveByUuid(uuid))
      );

      const response = await cache.insert<Archive[]>(
        { req },
        archives,
        archivesFilter
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/archive/:uuid')
  .get(cacheMiddleware<Archive>(archiveFilter), async (req, res, next) => {
    try {
      const ArchiveDao = sl.get('ArchiveDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;

      const archiveExists = await ArchiveDao.archiveExists(uuid);
      if (!archiveExists) {
        next(new HttpBadRequest('Archive does not exist'));
        return;
      }

      const archive = await ArchiveDao.getArchiveByUuid(uuid);

      const response = await cache.insert<Archive>(
        { req },
        archive,
        archiveFilter
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const ArchiveDao = sl.get('ArchiveDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');

      const { uuid } = req.params;
      const textUuid = req.params.textUuid as string;

      await utils.createTransaction(async trx => {
        await ArchiveDao.disconnectText(textUuid, uuid, trx);
      });

      await cache.clear('/archives', { level: 'exact' });
      await cache.clear('/archive/', { level: 'startsWith' });
      await cache.clear('/dossier/', { level: 'startsWith' });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/dossier/:uuid')
  .get(cacheMiddleware<Dossier>(dossierFilter), async (req, res, next) => {
    try {
      const ArchiveDao = sl.get('ArchiveDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;

      const dossierExists = await ArchiveDao.archiveExists(uuid);
      if (!dossierExists) {
        next(new HttpBadRequest('Dossier does not exist'));
        return;
      }

      const dossier = await ArchiveDao.getDossierByUuid(uuid);

      const response = await cache.insert<Dossier>(
        { req },
        dossier,
        dossierFilter
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
