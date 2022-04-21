import express from 'express';
import { HttpInternalError, HttpBadRequest } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/collections';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/collection_info/:uuid')
  .get(collectionsMiddleware, async (req, res, next) => {
    try {
      const uuid = req.params.uuid as string;

      const CollectionDao = sl.get('CollectionDao');

      const collection = await CollectionDao.getCollectionByUuid(uuid);

      if (!collection) {
        next(new HttpBadRequest(`Non-existent collection UUID: ${uuid}`));
        return;
      }

      res.json(collection);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
