import express from 'express';
import { HttpInternalError } from '@/exceptions';
import collectionsMiddleware from '@/middlewares/collections';
import aliasDao from './daos/AliasDao';

const router = express.Router();

router.route('/collection_info/:uuid').get(collectionsMiddleware, async (req, res, next) => {
  try {
    const uuid = req.params.uuid as string;

    const name = await aliasDao.textAliasNames(uuid);
    res.json({
      name,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
