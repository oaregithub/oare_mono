import express from 'express';
import HttpException from '../exceptions/HttpException';
import hierarchyDao from './daos/HierarchyDao';
import collectionsMiddleware from '../middlewares/collections';
import cache from '../cache';

const router = express.Router();

router.route('/collections').get(async (req, res, next) => {
  try {
    const user = req.user || null;
    const isAdmin = user ? user.isAdmin : false;

    const collections = await hierarchyDao.getAllCollections(isAdmin);
    res.json(collections);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

router.route('/collections/:uuid').get(collectionsMiddleware, async (req, res, next) => {
  try {
    const uuid = req.params.uuid as string;
    const user = req.user || null;
    const page = req.query.page ? ((req.query.page as unknown) as number) : 1;
    const rows = req.query.rows ? ((req.query.rows as unknown) as number) : 10;
    const search = req.query.query ? (req.query.query as string) : '';

    const { totalTexts, results } = await hierarchyDao.getCollectionTexts(user, uuid, {
      page,
      rows,
      search,
    });

    const response = {
      totalTexts,
      texts: results,
    };

    cache.insert({ reqPath: req.originalUrl, userId: user?.id || null }, response);

    res.json(response);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
