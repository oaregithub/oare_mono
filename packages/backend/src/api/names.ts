import express from 'express';
import dictionaryWordDao from './daos/DictionaryWordDao';
import HttpException from '../exceptions/HttpException';
import cache from '../cache';

const router = express.Router();

router.route('/names').get(async (req, res, next) => {
  try {
    const dictionaryNames = await dictionaryWordDao.getNames();

    cache.insert({ req }, dictionaryNames);
    res.json(dictionaryNames);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
