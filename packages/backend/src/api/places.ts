import express from 'express';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/places').get(async (req, res, next) => {
  try {
    const dictionaryPlaces = await dictionaryWordDao.getPlaces();

    cache.insert({ req }, dictionaryPlaces);
    res.json(dictionaryPlaces);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
