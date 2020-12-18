import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/search_collection_names').get(async (req, res, next) => {
  const HierarchyDao = sl.get('HierarchyDao');
  try {
    const page = Number(req.query.page as string);
    const rows = Number(req.query.rows as string);
    const search = req.query.search as string;
    const groupId = Number(req.query.groupId as string);

    res.json(await HierarchyDao.getCollectionsBySearchTerm(page, rows, search, groupId));
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
