import express from 'express';
import { SearchTextsResponse, SearchTextsPayload } from '@oare/types';
import cache from '@/cache';
import { HttpInternalError } from '@/exceptions';
import textGroupDao from './daos/TextGroupDao';
import textEpigraphyDao from './daos/TextEpigraphyDao';

const router = express.Router();

router.route('/search').get(async (req, res, next) => {
  try {
    const { page, rows, textTitle, characters } = (req.query as unknown) as SearchTextsPayload;
    const user = req.user || null;

    const blacklist = await textGroupDao.getUserBlacklist(user);
    const totalRows = await textEpigraphyDao.totalSearchRows(characters, textTitle, blacklist);
    const texts = await textEpigraphyDao.searchTexts(characters, textTitle, blacklist, {
      page,
      rows,
    });

    const searchResults: SearchTextsResponse = {
      totalRows,
      results: texts,
    };

    cache.insert({ req }, searchResults);
    res.json(searchResults);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
