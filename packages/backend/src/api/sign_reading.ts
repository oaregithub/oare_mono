import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/sign_reading/:sign').get(async (req, res, next) => {
  try {
    const SignReadingDao = sl.get('SignReadingDao');
    const { sign } = req.params;
    const cache = sl.get('cache');

    const signCode = await SignReadingDao.getSignCode(sign);
    cache.insert({ req }, signCode);
    res.json(signCode);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router.route('/sign_reading/format/:sign').get(async (req, res, next) => {
  try {
    const SignReadingDao = sl.get('SignReadingDao');
    const { sign } = req.params;
    const cache = sl.get('cache');

    const formattedSign = await SignReadingDao.getFormattedSign(sign);
    cache.insert({ req }, formattedSign);
    res.json(formattedSign);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
