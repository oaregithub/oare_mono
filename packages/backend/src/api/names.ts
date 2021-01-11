import express from 'express';
import { HttpInternalError } from '@/exceptions';
import cache from '@/cache';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/names/:letter').get(async (req, res, next) => {
  try {
    const { letter } = req.params;
    const dictionaryNames = await dictionaryWordDao.getNames(letter.toLowerCase());

    cache.insert({ req }, dictionaryNames);
    res.json(dictionaryNames);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
