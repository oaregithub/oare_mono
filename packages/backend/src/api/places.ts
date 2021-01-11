import express from 'express';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/places/:letter').get(async (req, res, next) => {
  try {
    const { letter } = req.params;
    const dictionaryPlaces = await dictionaryWordDao.getPlaces(letter.toLowerCase());

    cache.insert({ req }, dictionaryPlaces);
    res.json(dictionaryPlaces);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
