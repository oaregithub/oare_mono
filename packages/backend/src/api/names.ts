import express from 'express';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/names/:letter').get(async (req, res, next) => {
  try {
    const { letter } = req.params;
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const dictionaryNames = await DictionaryWordDao.getNames(letter.toLowerCase());

    cache.insert({ req }, dictionaryNames);
    res.json(dictionaryNames);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
