import express from 'express';
import sl from '@/serviceLocator';
import adminRoute from '@/middlewares/adminRoute';
import { HttpInternalError } from '@/exceptions';
import { NewDiscourseRowPayload } from '@oare/types';

const router = express.Router();

router.route('/text_discourse').post(adminRoute, async (req, res, next) => {
  const TextDiscourseDao = sl.get('TextDiscourseDao');
  const {
    spelling,
    epigraphyUuids,
    textUuid,
  }: NewDiscourseRowPayload = req.body;

  try {
    await TextDiscourseDao.insertNewDiscourseRow(
      spelling,
      epigraphyUuids,
      textUuid
    );
    res.status(201).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
