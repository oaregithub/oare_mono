import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/text_info/:uuid').get(async (req, res, next) => {
  try {
    const AliasDao = sl.get('AliasDao');
    const uuid = req.params.uuid as string;
    const name = await AliasDao.displayAliasNames(uuid);

    res.json({ name });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
