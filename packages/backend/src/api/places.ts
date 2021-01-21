import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/places').get(async (req, res, next) => {
  try {
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const cache = sl.get('cache');

    const dictionaryPlaces = await DictionaryWordDao.getPlaces();

    cache.insert({ req }, dictionaryPlaces);
    res.json(dictionaryPlaces);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
