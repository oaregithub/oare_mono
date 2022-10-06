import express from 'express';
import { TextRow } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/text/:textUuid').get(async (req, res, next) => {
  const TextDao = sl.get('TextDao');

  try {
    const { textUuid } = req.params;
    const textRow: TextRow | null = await TextDao.getTextRowByUuid(textUuid);

    res.json(textRow);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
