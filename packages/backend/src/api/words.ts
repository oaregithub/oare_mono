import express from 'express';
import { WordsResponse } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/words').get(async (req, res, next) => {
  try {
    const words = await dictionaryWordDao.getWords();
    const response: WordsResponse = {
      words,
    };
    cache.insert({ req }, response);
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
