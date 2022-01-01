import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { NewDiscourseRowPayload } from '@oare/types';
import permissionRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/text_discourse')
  .post(permissionRoute('INSERT_DISCOURSE_ROWS'), async (req, res, next) => {
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const {
      spelling,
      formUuid,
      occurrences,
    }: NewDiscourseRowPayload = req.body;

    try {
      for (let i = 0; i < occurrences.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await TextDiscourseDao.insertNewDiscourseRow(
          spelling,
          formUuid,
          occurrences[i].epigraphyUuids,
          occurrences[i].textUuid
        );
      }
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/text_discourse/:uuid')
  .patch(permissionRoute('INSERT_DISCOURSE_ROWS'), async (req, res, next) => {
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const { uuid } = req.params;
    const { newTranslation } = req.body;

    try {
      await TextDiscourseDao.updateDiscourseTranslation(uuid, newTranslation);
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
