import express from 'express';
import HttpException from '@/exceptions/HttpException';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/places').get(async (req, res, next) => {
  try {
    const dictionaryPlaces = await dictionaryWordDao.getPlaces();

    cache.insert({ req }, dictionaryPlaces);
    res.json(dictionaryPlaces);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
