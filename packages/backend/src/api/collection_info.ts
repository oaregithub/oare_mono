import express from 'express';
import { HttpInternalError } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/collections';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/collection_info/:uuid')
  .get(collectionsMiddleware, async (req, res, next) => {
    try {
      const uuid = req.params.uuid as string;

      const AliasDao = sl.get('AliasDao');

      const name = await AliasDao.textAliasNames(uuid);
      res.json({
        name,
      });
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
