import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { SignCode } from '@oare/types';

const router = express.Router();

router.route('/sign_reading/code/:sign/:post').get(async (req, res, next) => {
  try {
    const SignReadingDao = sl.get('SignReadingDao');
    const { sign, post } = req.params;
    const cache = sl.get('cache');

    const isDeterminative = post === 'isPercent';
    if (sign === '@' || sign.includes('x')) {
      const signCode: SignCode = {
        signUuid: null,
        readingUuid: null,
        type: 'undetermined',
        code: null,
      };
      res.json(signCode);
    } else {
      const signCode = await SignReadingDao.getSignCode(sign, isDeterminative);
      cache.insert({ req }, signCode);
      res.json(signCode);
    }
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
