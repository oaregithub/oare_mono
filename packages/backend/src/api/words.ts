import express from 'express';
import { WordsResponse } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/words/:letter').get(async (req, res, next) => {
  try {
    const { letter } = req.params;
    const isAdmin = req.user ? req.user.isAdmin : false;
    const words = await dictionaryWordDao.getWords(
      'word',
      letter.toLowerCase(),
      isAdmin
    );
    const response: WordsResponse = {
      words,
    };
    cache.insert({ req }, response);
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
