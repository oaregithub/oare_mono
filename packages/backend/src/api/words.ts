import express from 'express';
import dictionaryWordDao from './daos/DictionaryWordDao';
import HttpException from '../exceptions/HttpException';
import cache from '../cache';

const router = express.Router();

router.route('/words').get(async (req, res, next) => {
  try {
    const words = await dictionaryWordDao.getWords();
    const canEdit = req.user ? req.user.isAdmin : false;
    const response = {
      words,
      canEdit,
    };
    cache.insert({ req }, response);
    res.json(response);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
