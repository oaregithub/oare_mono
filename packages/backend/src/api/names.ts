import express from 'express';
import dictionaryWordDao from './daos/DictionaryWordDao';
import HttpException from '../exceptions/HttpException';
import cache from '../cache';

const router = express.Router();

router.route('/names').get(async (req, res, next) => {
  try {
    const dictionaryNames = await dictionaryWordDao.getNames();
    const userId = req.user ? req.user.id : null;

    cache.insert({ reqPath: req.originalUrl, userId }, dictionaryNames);
    res.json(dictionaryNames);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
