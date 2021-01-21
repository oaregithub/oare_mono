import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/names').get(async (req, res, next) => {
  try {
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const cache = sl.get('cache');

    const dictionaryNames = await DictionaryWordDao.getNames();

    cache.insert({ req }, dictionaryNames);
    res.json(dictionaryNames);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
