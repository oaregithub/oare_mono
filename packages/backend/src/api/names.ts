import express from 'express';
import HttpException from '@/exceptions/HttpException';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

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
