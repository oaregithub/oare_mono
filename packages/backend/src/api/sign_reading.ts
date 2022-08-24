import express, { json } from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { SignCode, SignList } from '@oare/types';
import cacheMiddleware from '@/middlewares/cache';
import { noFilter } from '@/cache/filters';
import { concatenateReadings } from './daos/SignReadingDao/utils';

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

router.route('/signList/:sortBy').get(async (req, res, next) => {
  try {
    const SignReadingDao = sl.get('SignReadingDao');
    const { sortBy } = req.params;

    const signs: SignList[] = await SignReadingDao.getSignList();
    const signsWithFrequencies: SignList[] = await Promise.all(
      signs.map(async s => ({
        ...s,
        frequency: await SignReadingDao.getSignCount(s.signUuid),
      }))
    );
    const signList: SignList[] = await Promise.all(
      signsWithFrequencies.map(async s => {
        const signReadings = await SignReadingDao.getReadingsForSignList(
          s.signUuid
        );
        return {
          ...s,
          readings: await concatenateReadings(signReadings, s.frequency ?? 0),
        };
      })
    );
    const sortedSignList = signList.sort((a, b) => {
      if (sortBy === 'abz') {
        if (a.abz && !b.abz) return -1;
        if (!a.abz && b.abz) return 1;
        if (a.abz && b.abz) {
          const aAbz = parseFloat(a.abz);
          const bAbz = parseFloat(b.abz);
          if (aAbz !== bAbz) return aAbz - bAbz;
          return a.abz.localeCompare(b.abz);
        }
      }
      if (sortBy === 'mzl') {
        if (a.mzl && !b.mzl) return -1;
        if (!a.mzl && b.mzl) return 1;
        if (a.mzl && b.mzl) return a.mzl - b.mzl;
      }
      if (sortBy === 'frequency') {
        return (b.frequency ?? 0) - (a.frequency ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
    res.json({ result: sortedSignList });
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
