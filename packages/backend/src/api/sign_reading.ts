import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { SignCode } from '@oare/types';
import cacheMiddleware from '@/middlewares/cache';
import { noFilter } from '@/cache/filters';

const router = express.Router();

router
  .route('/sign_reading/code/:sign/:post')
  .get(cacheMiddleware<SignCode>(noFilter), async (req, res, next) => {
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
        const signCode = await SignReadingDao.getSignCode(
          sign,
          isDeterminative
        );
        const response = await cache.insert<SignCode>(
          { req },
          signCode,
          noFilter,
          24 * 7
        );
        res.json(response);
      }
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/sign_reading/format/:sign')
  .get(cacheMiddleware<string[]>(noFilter), async (req, res, next) => {
    try {
      const SignReadingDao = sl.get('SignReadingDao');
      const { sign } = req.params;
      const cache = sl.get('cache');

      const formattedSign = await SignReadingDao.getFormattedSign(sign);
      const response = await cache.insert<string[]>(
        { req },
        formattedSign,
        noFilter,
        24 * 7
      );
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
