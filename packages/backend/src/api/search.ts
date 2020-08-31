import express from 'express';
import HttpException from '../exceptions/HttpException';
import textGroupDao from './daos/TextGroupDao';
import textEpigraphyDao from './daos/TextEpigraphyDao';
import cache from '../cache';

const router = express.Router();

router.route('/search').get(async (req, res, next) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const rows = req.query.rows ? Number(req.query.rows) : 10;
    const textTitle = String(req.query.textTitle);
    const user = req.user ? req.user : null;
    const characters: string[] = req.query.characters ? (req.query.characters as string[]) : [];

    const blacklist = await textGroupDao.getUserBlacklist(user);
    const totalRows = await textEpigraphyDao.totalSearchRows(characters, textTitle, blacklist);
    const texts = await textEpigraphyDao.searchTexts(characters, textTitle, blacklist, {
      page,
      rows,
    });

    const searchResults = {
      totalRows,
      results: texts,
    };

    cache.insert({ reqPath: req.originalUrl, userId: user ? user.id : null }, searchResults);
    res.json(searchResults);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
