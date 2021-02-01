import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { PermissionsListType, SearchNamesPayload } from '@oare/types';

const router = express.Router();

router.route('/search_names').get(async (req, res, next) => {
  const HierarchyDao = sl.get('HierarchyDao');
  try {
    const searchParams: SearchNamesPayload = {
      page: Number(req.query.page as string),
      rows: Number(req.query.rows as string),
      search: req.query.search as string,
      groupId: req.query.groupId as string,
      type: req.query.type as PermissionsListType,
    };

    res.json(await HierarchyDao.getBySearchTerm(searchParams));
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
