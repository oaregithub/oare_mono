import express from 'express';
import { HttpInternalError } from '@/exceptions';
import { Archive, Dossier, DisconnectTextPayload } from '@oare/types';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/adminRoute';

const router = express.Router();

router.route('/archives').get(async (req, res, next) => {
  try {
    const userUuid = req.user ? req.user.uuid : null;
    const ArchiveDao = sl.get('ArchiveDao');
    const archiveUuids = await ArchiveDao.getAllArchives();
    const archives = await Promise.all(
      archiveUuids.map(uuid => ArchiveDao.getArchiveInfo(uuid, userUuid))
    );

    const archivesSorted = archives.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.json(archivesSorted);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/archives/:uuid').get(async (req, res, next) => {
  try {
    const uuid = req.params.uuid as string;
    const userUuid = req.user ? req.user.uuid : null;
    const utils = sl.get('utils');
    const ArchiveDao = sl.get('ArchiveDao');
    const { filter: search, limit: rows, page } = utils.extractPagination(
      req.query
    );
    const response: Archive = await ArchiveDao.getArchiveByUuid(
      uuid,
      userUuid,
      {
        page,
        rows,
        search,
      }
    );

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/dossier/:uuid').get(async (req, res, next) => {
  try {
    const uuid = req.params.uuid as string;
    const userUuid = req.user ? req.user.uuid : null;
    const ArchiveDao = sl.get('ArchiveDao');
    const utils = sl.get('utils');
    const { filter: search, limit: rows, page } = utils.extractPagination(
      req.query
    );

    const response: Dossier = await ArchiveDao.getDossierByUuid(
      uuid,
      userUuid,
      {
        page,
        rows,
        search,
      }
    );

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/archive_dossier/disconnect_text')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const ArchiveDao = sl.get('ArchiveDao');
      const utils = sl.get('utils');
      const {
        textUuid,
        archiveOrDossierUuid,
      }: DisconnectTextPayload = req.body as DisconnectTextPayload;

      await utils.createTransaction(async trx => {
        await ArchiveDao.disconnectText(textUuid, archiveOrDossierUuid, trx);
      });
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
