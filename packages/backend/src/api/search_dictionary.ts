import express from 'express';
import { DictionarySearchPayload } from '@oare/types';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/search_dictionary').get(async (req, res, next) => {
  try {
    const {
      search,
      page,
      rows,
      mode,
      types,
    } = (req.query as unknown) as DictionarySearchPayload;
    const userUuid = req.user ? req.user.uuid : null;

    const results = await dictionaryWordDao.searchWords(
      search,
      page,
      rows,
      mode,
      types
    );

    if (results.results.length === 0) {
      const SearchFailureDao = sl.get('SearchFailureDao');
      await SearchFailureDao.insertSearchFailure('words', search, userUuid);
    }

    res.json(results);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
