import express from 'express';
import { HttpInternalError } from '@/exceptions';
import { Archive, Dossier } from '@oare/types';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';
import cacheMiddleware from '@/middlewares/router/cache';
import { archiveFilter, archivesFilter, dossierFilter } from '@/cache/filters';

// VERIFIED COMPLETE

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
  });

router
  .route('/dossier/:uuid')
  .get(cacheMiddleware<Dossier>(dossierFilter), async (req, res, next) => {
    try {
      const ArchiveDao = sl.get('ArchiveDao');
      const cache = sl.get('cache');

      const { uuid } = req.params;

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

router
  .route('/archive/:archiveUuid/disconnect_text/:textUuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const ArchiveDao = sl.get('ArchiveDao');
      const utils = sl.get('utils');
      const cache = sl.get('cache');

      const { archiveUuid, textUuid } = req.params;

      await utils.createTransaction(async trx => {
        await ArchiveDao.disconnectText(textUuid, archiveUuid, trx);
      });

      await cache.clear('/archives', { level: 'exact' });
      await cache.clear('/archive/', { level: 'startsWith' });
      await cache.clear('/dossier/', { level: 'startsWith' });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
