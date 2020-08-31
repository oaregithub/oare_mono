import express from 'express';
import HttpException from '../exceptions/HttpException';
import dictionaryWordDao from './daos/DictionaryWordDao';
import cache from '../cache';

const router = express.Router();

router.route('/search_dictionary').get(async (req, res, next) => {
  try {
    const search = String(req.query.search);
    const page = req.query.page ? Number(req.query.page) : 1;
    const numRows = req.query.rows ? Number(req.query.rows) : 10;
    const userId = req.user ? req.user.id : null;

    const results = await dictionaryWordDao.searchWords(search, page, numRows);
    cache.insert({ userId, reqPath: req.originalUrl }, results);
    res.json(results);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
