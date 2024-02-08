import express from 'express';
import { QuarantineText } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/router/adminRoute';

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

      const textExists = await TextDao.textExists(textUuid);
      if (!textExists) {
        next(new HttpBadRequest('Text does not exist.'));
        return;
      }

      await QuarantineTextDao.quarantineText(textUuid);

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

export default router;
