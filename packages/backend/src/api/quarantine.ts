import express from 'express';
import { QuarantineText } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '../middlewares/adminRoute';

const router = express.Router();

router
  .route('/quarantine/:textUuid')
  .post(adminRoute, async (req, res, next) => {
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const TextDao = sl.get('TextDao');

    try {
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

      await QuarantineTextDao.quarantineText(textUuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    const QuarantineTextDao = sl.get('QuarantineTextDao');

    try {
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

      res.status(204).send();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router.route('/quarantine').get(adminRoute, async (_req, res, next) => {
  const QuarantineTextDao = sl.get('QuarantineTextDao');
  const TextDao = sl.get('TextDao');
  const TextEpigraphyDao = sl.get('TextEpigraphyDao');

  try {
    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextRows();

    const hasEpigraphy = await Promise.all(
      quarantinedTexts.map(row => TextEpigraphyDao.hasEpigraphy(row.uuid))
    );

    const texts = await Promise.all(
      quarantinedTexts.map(row => TextDao.getTextByUuid(row.uuid))
    );

    const response: QuarantineText[] = quarantinedTexts.map((text, idx) => ({
      text: texts[idx]!,
      hasEpigraphy: hasEpigraphy[idx],
      timestamp: text.timestamp,
    }));

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/quarantine/permanent_delete/:textUuid')
  .delete(adminRoute, async (req, res, next) => {
    const utils = sl.get('utils');
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const GroupEditPermissionsDao = sl.get('GroupEditPermissionsDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const TextMarkupDao = sl.get('TextMarkupDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const ResourceDao = sl.get('ResourceDao');
    const HierarchyDao = sl.get('HierarchyDao');
    const TextDao = sl.get('TextDao');
    const NoteDao = sl.get('NoteDao');
    const AliasDao = sl.get('AliasDao');
    const FieldDao = sl.get('FieldDao');
    const TextDraftsDao = sl.get('TextDraftsDao');

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
        await TextDraftsDao.removeDraftsByTextUuid(textUuid, trx);
        await TextDao.removeTextByUuid(textUuid, trx);
      });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
