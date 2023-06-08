import express from 'express';
import { QuarantineText } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';

// MOSTLY COMPLETE

const router = express.Router();

router
  .route('/quarantine/:textUuid')
  .post(adminRoute, async (req, res, next) => {
    try {
      const QuarantineTextDao = sl.get('QuarantineTextDao');
      const TextDao = sl.get('TextDao');

      const { textUuid } = req.params;

      const isAlreadyQuarantined = await QuarantineTextDao.textIsQuarantined(
        textUuid
      );
      if (isAlreadyQuarantined) {
        next(
          new HttpBadRequest(
            'Cannot quarantine a text that is already in the quarantine list.'
          )
        );
        return;
      }

      const text = await TextDao.getTextByUuid(textUuid);
      if (!text) {
        next(
          new HttpBadRequest(
            'Requested text does not exist and cannot be quarantined.'
          )
        );
        return;
      }

      // FIXME perhaps upon quarantine, the text should be removed from denylist/allowlists/edit permissions?

      await QuarantineTextDao.quarantineText(textUuid);

      // FIXME when quarantined, there are probably some cache routes that should be cleared

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const QuarantineTextDao = sl.get('QuarantineTextDao');

      const { textUuid } = req.params;

      const isAlreadyQuarantined = await QuarantineTextDao.textIsQuarantined(
        textUuid
      );
      if (!isAlreadyQuarantined) {
        next(
          new HttpBadRequest('Cannot restore a text that is not quarantined.')
        );
        return;
      }

      await QuarantineTextDao.removeQuarantineTextRow(textUuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/quarantine').get(adminRoute, async (_req, res, next) => {
  try {
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const TextDao = sl.get('TextDao');

    const textUuids = await QuarantineTextDao.getAllQuarantinedTextUuids();

    const quarantineTextRows = await Promise.all(
      textUuids.map(uuid =>
        QuarantineTextDao.getQuarantineTextRowByReferenceUuid(uuid)
      )
    );

    const texts = await Promise.all(
      textUuids.map(uuid => TextDao.getTextByUuid(uuid))
    );

    const response: QuarantineText[] = quarantineTextRows.map((row, idx) => ({
      ...row,
      text: texts[idx],
    }));

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

// FIXME consider deprecating this route
router
  .route('/quarantine/permanent_delete/:textUuid')
  .delete(adminRoute, async (req, res, next) => {
    const utils = sl.get('utils');
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const GroupEditPermissionsDao = sl.get('GroupEditPermissionsDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const ResourceDao = sl.get('ResourceDao');
    const HierarchyDao = sl.get('HierarchyDao');
    const TextDao = sl.get('TextDao');
    const NoteDao = sl.get('NoteDao');
    const AliasDao = sl.get('AliasDao');
    const FieldDao = sl.get('FieldDao');

    try {
      const { textUuid } = req.params;

      await utils.createTransaction(async trx => {
        await QuarantineTextDao.removeQuarantineTextRow(textUuid, trx);
        await PublicDenylistDao.removeItemFromDenylist(textUuid, trx);
        await GroupAllowlistDao.removeItemFromAllAllowlists(textUuid, trx);
        await GroupEditPermissionsDao.removeItemFromAllEditPermissions(
          textUuid,
          trx
        );
        await ItemPropertiesDao.deletePropertiesByReferenceUuid(textUuid, trx);
        await TextEpigraphyDao.removeEpigraphyRowsByTextUuid(textUuid, trx);
        await TextDiscourseDao.removeDiscourseRowsByTextUuid(textUuid, trx);
        await ResourceDao.removeLinkRowByReferenceUuid(textUuid, trx);
        await HierarchyDao.removeHierarchyTextRowsByTextUuid(textUuid, trx);
        await NoteDao.removeNotesByReferenceUuid(textUuid, trx);
        await AliasDao.removeAliasByReferenceUuid(textUuid, trx);
        await FieldDao.removeFieldRowsByReferenceUuid(textUuid, trx);
        await TextDao.removeTextByUuid(textUuid, trx);
      });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
