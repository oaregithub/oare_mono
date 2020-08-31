import express from 'express';
import dictionaryWordDao from './daos/DictionaryWordDao';
import HttpException from '../exceptions/HttpException';
import cache from '../cache';

const router = express.Router();

router.route('/words').get(async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;

    const words = await dictionaryWordDao.getWords();
    cache.insert({ reqPath: req.originalUrl, userId }, words);
    res.json(words);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
