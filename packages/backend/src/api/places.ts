import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/places/:letter').get(async (req, res, next) => {
  try {
    const { letter } = req.params;
    const cache = sl.get('cache');
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const dictionaryPlaces = await DictionaryWordDao.getPlaces(letter.toLowerCase());

    cache.insert({ req }, dictionaryPlaces);
    res.json(dictionaryPlaces);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
