import express from 'express';
import { HttpInternalError } from '@/exceptions';
import textDiscourseDao from './daos/TextDiscourseDao';

const router = express.Router();

router.route('/discourses/:textUuid').get(async (req, res, next) => {
  try {
    const textUuid = String(req.params.textUuid);
    const nestedDiscourses = await textDiscourseDao.getTextDiscourseUnits(textUuid);

    res.json(nestedDiscourses);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
