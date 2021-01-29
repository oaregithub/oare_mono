import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { PermissionsListType } from '@oare/types';

const router = express.Router();

router.route('/search_names').get(async (req, res, next) => {
  const HierarchyDao = sl.get('HierarchyDao');
  try {
    const page = Number(req.query.page as string);
    const rows = Number(req.query.rows as string);
    const search = req.query.search as string;
    const groupId = Number(req.query.groupId as string);
    const type = req.query.type as PermissionsListType;

    res.json(await HierarchyDao.getBySearchTerm(page, rows, search, type, groupId));
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
