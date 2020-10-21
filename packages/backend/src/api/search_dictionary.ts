import express from 'express';
import { DictionarySearchPayload } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/search_dictionary').get(async (req, res, next) => {
  try {
    const { search, page, rows } = (req.query as unknown) as DictionarySearchPayload;

    const results = await dictionaryWordDao.searchWords(search, page, rows);
    cache.insert({ req }, results);
    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
