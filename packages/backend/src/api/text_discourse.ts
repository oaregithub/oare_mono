import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import {
  NewDiscourseRowPayload,
  SearchNullDiscourseResultRow,
} from '@oare/types';
import permissionRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/text_discourse')
  .post(permissionRoute('INSERT_DISCOURSE_ROWS'), async (req, res, next) => {
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const { spelling, occurrences }: NewDiscourseRowPayload = req.body;

    try {
      const uniqueTextUuids = [
        ...new Set(occurrences.map(occ => occ.textUuid)),
      ];
      const occurrencesByText: SearchNullDiscourseResultRow[][] = uniqueTextUuids.map(
        textUuid => occurrences.filter(occ => occ.textUuid === textUuid)
      );
      await Promise.all(
        occurrencesByText.map(async occurrenceBatch => {
          for (let i = 0; i < occurrenceBatch.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await TextDiscourseDao.insertNewDiscourseRow(
              spelling,
              occurrenceBatch[i].epigraphyUuids,
              occurrenceBatch[i].textUuid
            );
          }
        })
      );
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
