import express from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/collections';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/collections').get(async (req, res, next) => {
  try {
    const user = req.user || null;
    const isAdmin = user ? user.isAdmin : false;

    const HierarchyDao = sl.get('HierarchyDao');

    const collections = await HierarchyDao.getAllCollections(isAdmin, user);
    res.json(collections);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/collections/:uuid')
  .get(collectionsMiddleware, async (req, res, next) => {
    try {
      const uuid = req.params.uuid as string;
      const user = req.user || null;
      const utils = sl.get('utils');

      const { filter: search, limit: rows, page } = utils.extractPagination(
        req.query
      );

      const HierarchyDao = sl.get('HierarchyDao');

      const response = await HierarchyDao.getCollectionTexts(user, uuid, {
        page,
        rows,
        search,
      });

      if (response.isForbidden) {
        next(
          new HttpForbidden(
            'You do not have permission to view this collection. If you think this is a mistake, please contact your administrator.'
          )
        );
        return;
      }

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
