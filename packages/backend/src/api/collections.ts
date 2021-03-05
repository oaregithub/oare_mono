import express from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/collections';
import sl from '@/serviceLocator';
import authFirst from '../middlewares/authFirst';

const router = express.Router();

router.route('/collections').get(authFirst, async (req, res, next) => {
  try {
    const userUuid = req.user ? req.user.uuid : null;

    const HierarchyDao = sl.get('HierarchyDao');

    const collections = await HierarchyDao.getAllCollections(userUuid);
    res.json(collections);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

router
  .route('/collections/:uuid')
  .get(authFirst, collectionsMiddleware, async (req, res, next) => {
    try {
      const CollectionGroupDao = sl.get('CollectionGroupDao');
      const uuid = req.params.uuid as string;
      const userUuid = req.user ? req.user.uuid : null;
      const utils = sl.get('utils');

      const canViewCollection = await CollectionGroupDao.canViewCollection(
        uuid,
        userUuid
      );
      if (!canViewCollection) {
        next(
          new HttpForbidden(
            'You do not have permission to view this collection. If you think this is a mistake, please contact your administrator.'
          )
        );
        return;
      }

      const { filter: search, limit: rows, page } = utils.extractPagination(
        req.query
      );

      const HierarchyDao = sl.get('HierarchyDao');

      const response = await HierarchyDao.getCollectionTexts(userUuid, uuid, {
        page,
        rows,
        search,
      });

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
