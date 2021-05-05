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
    const { spelling, occurrences }: NewDiscourseRowPayload = req.body;

    try {
      await Promise.all(
        occurrences.map(occurrence =>
          TextDiscourseDao.insertNewDiscourseRow(
            spelling,
            occurrence.epigraphyUuids,
            occurrence.textUuid
          )
        )
      );
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
